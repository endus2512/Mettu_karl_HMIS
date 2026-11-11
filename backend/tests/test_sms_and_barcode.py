"""
Tests for SMS Gateway, USSD Simulator (*907#), and Barcode/QR Code Scanner.
"""
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_sms_dispatch_and_templates(
    client: AsyncClient,
    doctor_auth_headers: dict[str, str],
):
    """Test localized SMS template retrieval (Staff required; unauth blocked)."""
    unauth = await client.get("/api/v1/sms/templates")
    assert unauth.status_code == 401

    # 1. Get templates as staff
    tpl_res = await client.get("/api/v1/sms/templates", headers=doctor_auth_headers)
    assert tpl_res.status_code == 200
    tpl_data = tpl_res.json()
    assert "queue_alert" in tpl_data["templates"]
    assert "om" in tpl_data["supported_languages"]
    assert "*907#" in tpl_data["ussd_shortcodes"]


@pytest.mark.asyncio
async def test_ussd_session_flow(client: AsyncClient):
    """Test USSD interactive navigation for feature phone users without internet (Public carrier webhook)."""
    # Step 1: Initial dial *907# (text = "")
    init_res = await client.post("/api/v1/sms/ussd", json={
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
    q_res = await client.post("/api/v1/sms/ussd", json={
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
    b_res = await client.post("/api/v1/sms/ussd", json={
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
async def test_barcode_and_qr_resolver(
    client: AsyncClient,
    pharmacist_auth_headers: dict[str, str],
):
    """Test barcode and QR code decoding across medicines, wristbands, and invoices (Staff required)."""
    unauth = await client.get("/api/v1/barcode/resolve?code=MED-AMX-625")
    assert unauth.status_code == 401

    # 1. Test Medicine Barcode
    med_res = await client.get("/api/v1/barcode/resolve?code=MED-AMX-625", headers=pharmacist_auth_headers)
    assert med_res.status_code == 200
    med_data = med_res.json()
    assert med_data["matched"] is True
    assert med_data["entity_type"] == "medicine_package"
    assert "Amoxicillin" in med_data["label"]
    assert med_data["details"]["current_stock"] == 420

    # 2. Test Patient Wristband QR Code
    pat_res = await client.get("/api/v1/barcode/resolve?code=MKH-PAT:MKH-2026-0001:pat-mkrh-0001", headers=pharmacist_auth_headers)
    assert pat_res.status_code == 200
    pat_data = pat_res.json()
    assert pat_data["matched"] is True
    assert pat_data["entity_type"] == "patient_wristband"
    assert pat_data["details"]["mrn"] == "MKH-2026-0001"
    assert pat_data["details"]["blood_group"] == "O+"

    # 3. Test Cashier Invoice QR Code
    inv_res = await client.get("/api/v1/barcode/resolve?code=MKH-INV:INV-2026-MKH-0192", headers=pharmacist_auth_headers)
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert inv_data["matched"] is True
    assert inv_data["entity_type"] == "invoice_receipt"
    assert inv_data["details"]["invoice_number"] == "INV-2026-MKH-0192"

    # 4. Test Presets
    presets_res = await client.get("/api/v1/barcode/presets", headers=pharmacist_auth_headers)
    assert presets_res.status_code == 200
    presets = presets_res.json()
    assert len(presets["medicines"]) >= 4
    assert len(presets["patient_wristbands"]) >= 2


@pytest.mark.asyncio
async def test_sms_gateway_configuration_and_test_ping(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
):
    """Test dynamic SMS gateway configuration and connection test (Admin only; non-admin blocked)."""
    unauth = await client.get("/api/v1/sms/config")
    assert unauth.status_code == 401
    non_admin = await client.get("/api/v1/sms/config", headers=doctor_auth_headers)
    assert non_admin.status_code == 403

    # 1. Get initial gateway config as Admin
    cfg_res = await client.get("/api/v1/sms/config", headers=admin_auth_headers)
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()
    assert "provider" in cfg

    # 2. Update config to Twilio as Admin
    up_res = await client.post("/api/v1/sms/config", json={
        "provider": "twilio",
        "is_active": True,
        "twilio_account_sid": "mock_twilio_account_sid_test",
        "twilio_auth_token": "token_mock_secret_12345",
        "twilio_from_number": "+1234567890",
    }, headers=admin_auth_headers)
    assert up_res.status_code == 200
    up_cfg = up_res.json()
    assert up_cfg["is_configured"] is True
    assert up_cfg["twilio_from_number"] == "+1234567890"

    # 3. Test connection endpoint as Admin
    ping_res = await client.post("/api/v1/sms/test-connection", json={
        "phone_number": "0911223344",
        "message": "Testing SMS Gateway Connectivity",
    }, headers=admin_auth_headers)
    assert ping_res.status_code == 200
    ping = ping_res.json()
    assert ping["phone_number"] == "+251911223344"
    assert "carrier_message" in ping
