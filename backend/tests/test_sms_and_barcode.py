"""
Tests for SMS Gateway, USSD Simulator (*907#), and Barcode/QR Code Scanner.
"""
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_sms_dispatch_and_templates():
    """Test localized SMS dispatch and template retrieval."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Get templates
        tpl_res = await ac.get("/api/v1/sms/templates")
        assert tpl_res.status_code == 200
        tpl_data = tpl_res.json()
        assert "queue_alert" in tpl_data["templates"]
        assert "om" in tpl_data["supported_languages"]
        assert "*907#" in tpl_data["ussd_shortcodes"]


@pytest.mark.asyncio
async def test_ussd_session_flow():
    """Test USSD interactive navigation for feature phone users without internet."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Initial dial *907# (text = "")
        init_res = await ac.post("/api/v1/sms/ussd", json={
            "session_id": "TEST-USSD-001",
            "phone_number": "+251911002233",
            "service_code": "*907#",
            "text": "",
            "language": "om"
        })
        assert init_res.status_code == 200
        data = init_res.json()
        assert data["action"] == "CON"
        assert "Dabaree OPD" in data["response"]

        # Step 2: Select Option 1 (Queue Status)
        q_res = await ac.post("/api/v1/sms/ussd", json={
            "session_id": "TEST-USSD-001",
            "phone_number": "+251911002233",
            "service_code": "*907#",
            "text": "1",
            "language": "om"
        })
        assert q_res.status_code == 200
        q_data = q_res.json()
        assert q_data["action"] == "END"
        assert "Tokkeenii Keessan" in q_data["response"]

        # Step 3: Select Option 3 (Billing & Telebirr) in Amharic
        b_res = await ac.post("/api/v1/sms/ussd", json={
            "session_id": "TEST-USSD-002",
            "phone_number": "+251911002233",
            "service_code": "*907#",
            "text": "3",
            "language": "am"
        })
        assert b_res.status_code == 200
        b_data = b_res.json()
        assert b_data["action"] == "END"
        assert "የክፍያ ሁኔታ" in b_data["response"]


@pytest.mark.asyncio
async def test_barcode_and_qr_resolver():
    """Test barcode and QR code decoding across medicines, wristbands, and invoices."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test Medicine Barcode
        med_res = await ac.get("/api/v1/barcode/resolve?code=MED-AMX-625")
        assert med_res.status_code == 200
        med_data = med_res.json()
        assert med_data["matched"] is True
        assert med_data["entity_type"] == "medicine_package"
        assert "Amoxicillin" in med_data["label"]
        assert med_data["details"]["current_stock"] == 420

        # 2. Test Patient Wristband QR Code
        pat_res = await ac.get("/api/v1/barcode/resolve?code=MKH-PAT:MKH-2026-0001:pat-mkrh-0001")
        assert pat_res.status_code == 200
        pat_data = pat_res.json()
        assert pat_data["matched"] is True
        assert pat_data["entity_type"] == "patient_wristband"
        assert pat_data["details"]["mrn"] == "MKH-2026-0001"
        assert pat_data["details"]["blood_group"] == "O+"

        # 3. Test Cashier Invoice QR Code
        inv_res = await ac.get("/api/v1/barcode/resolve?code=MKH-INV:INV-2026-MKH-0192")
        assert inv_res.status_code == 200
        inv_data = inv_res.json()
        assert inv_data["matched"] is True
        assert inv_data["entity_type"] == "invoice_receipt"
        assert inv_data["details"]["invoice_number"] == "INV-2026-MKH-0192"

        # 4. Test Presets
        presets_res = await ac.get("/api/v1/barcode/presets")
        assert presets_res.status_code == 200
        presets = presets_res.json()
        assert len(presets["medicines"]) >= 4
        assert len(presets["patient_wristbands"]) >= 2
