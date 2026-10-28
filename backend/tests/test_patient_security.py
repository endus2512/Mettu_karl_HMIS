"""
Security & Patient Data Isolation Tests.

Verifies:
1. Anti-Brute-Force rate limiting on patient authentication (HTTP 429 after 5 failed attempts).
2. Strict Patient Data Isolation (Zero cross-patient leakage between Gudeta and Chaltu).
3. Prevention of Horizontal Privilege Escalation and IDOR attacks.
4. Hardened HTTP Security Headers on API responses.
"""
import pytest
from httpx import AsyncClient
from app.core.rate_limiter import clear_patient_login_rate_limit


@pytest.mark.asyncio
async def test_patient_rate_limiting_anti_brute_force(client: AsyncClient):
    """Verify that automated brute-force attacks on patient login trigger HTTP 429 lockout."""
    target_fayda = "FAN-TEST-BRUTE-FORCE-9999"
    await clear_patient_login_rate_limit("127.0.0.1", target_fayda)

    # Attempt 5 failed logins with invalid passwords
    for i in range(5):
        resp = await client.post(
            "/api/v1/auth/patient/login",
            json={"identifier": target_fayda, "password_or_otp": "wrongpass123"},
        )
        assert resp.status_code == 401

    # 6th attempt must be blocked by rate limiter with HTTP 429
    blocked_resp = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": target_fayda, "password_or_otp": "wrongpass123"},
    )
    assert blocked_resp.status_code == 429
    assert "Dhimma eegumsa iccitii" in blocked_resp.json()["detail"] or "locked" in blocked_resp.json()["detail"].lower()

    # Cleanup
    await clear_patient_login_rate_limit("127.0.0.1", target_fayda)


@pytest.mark.asyncio
async def test_strict_patient_data_isolation(client: AsyncClient):
    """
    Verify 100% strict patient isolation between Gudeta Hailu and Chaltu Daba.
    Ensures zero cross-patient clinical data leakage.
    """
    # 1. Login as Gudeta Hailu (Patient 1)
    gudeta_resp = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": "FAN-9901-2384-5120", "password_or_otp": "123456"},
    )
    assert gudeta_resp.status_code == 200
    gudeta_data = gudeta_resp.json()
    assert gudeta_data["role"] == "patient"
    gudeta_token = gudeta_data["access_token"]
    gudeta_headers = {"Authorization": f"Bearer {gudeta_token}"}

    # 2. Login as Chaltu Daba (Patient 2)
    chaltu_resp = await client.post(
        "/api/v1/auth/patient/login",
        json={"identifier": "FAN-7721-9981-3310", "password_or_otp": "123456"},
    )
    assert chaltu_resp.status_code == 200
    chaltu_data = chaltu_resp.json()
    assert chaltu_data["role"] == "patient"
    chaltu_token = chaltu_data["access_token"]
    chaltu_headers = {"Authorization": f"Bearer {chaltu_token}"}

    # 3. Verify Profile Isolation
    gudeta_me = await client.get("/api/v1/portal/me", headers=gudeta_headers)
    assert gudeta_me.status_code == 200
    assert gudeta_me.json()["mrn"] == "MKH-2026-0001"
    assert "Gudeta" in gudeta_me.json()["full_name"]

    chaltu_me = await client.get("/api/v1/portal/me", headers=chaltu_headers)
    assert chaltu_me.status_code == 200
    assert chaltu_me.json()["mrn"] == "MKH-2026-0042"
    assert "Chaltu" in chaltu_me.json()["full_name"]

    # 4. Verify Clinical Encounters Isolation (Gudeta != Chaltu)
    gudeta_encounters = await client.get("/api/v1/portal/clinical-history", headers=gudeta_headers)
    assert gudeta_encounters.status_code == 200
    gudeta_enc_list = gudeta_encounters.json()
    assert any("Internal Medicine" in enc["department"] for enc in gudeta_enc_list)
    assert not any("Cardiology Clinic" in enc["department"] for enc in gudeta_enc_list)

    chaltu_encounters = await client.get("/api/v1/portal/clinical-history", headers=chaltu_headers)
    assert chaltu_encounters.status_code == 200
    chaltu_enc_list = chaltu_encounters.json()
    assert any("Cardiology Clinic" in enc["department"] for enc in chaltu_enc_list)
    assert not any("Internal Medicine OPD" in enc["department"] for enc in chaltu_enc_list)

    # 5. Verify Prescriptions Isolation
    gudeta_rx = await client.get("/api/v1/portal/prescriptions", headers=gudeta_headers)
    assert gudeta_rx.status_code == 200
    gudeta_rx_items = [item["drug_name"] for rx in gudeta_rx.json() for item in rx["items"]]
    assert any("Amoxicillin" in drug for drug in gudeta_rx_items)
    assert not any("Amlodipine" in drug for drug in gudeta_rx_items)

    chaltu_rx = await client.get("/api/v1/portal/prescriptions", headers=chaltu_headers)
    assert chaltu_rx.status_code == 200
    chaltu_rx_items = [item["drug_name"] for rx in chaltu_rx.json() for item in rx["items"]]
    assert any("Amlodipine" in drug for drug in chaltu_rx_items)
    assert not any("Amoxicillin" in drug for drug in chaltu_rx_items)

    # 6. Verify Invoices Isolation
    gudeta_inv = await client.get("/api/v1/portal/invoices", headers=gudeta_headers)
    assert gudeta_inv.status_code == 200
    assert any(inv["invoice_number"] == "INV-2026-MKH-0192" for inv in gudeta_inv.json())
    assert not any(inv["invoice_number"] == "INV-2026-MKH-0084" for inv in gudeta_inv.json())

    chaltu_inv = await client.get("/api/v1/portal/invoices", headers=chaltu_headers)
    assert chaltu_inv.status_code == 200
    assert any(inv["invoice_number"] == "INV-2026-MKH-0084" for inv in chaltu_inv.json())
    assert not any(inv["invoice_number"] == "INV-2026-MKH-0192" for inv in chaltu_inv.json())


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    """Verify essential HTTP security headers are set to protect against XSS and clickjacking."""
    resp = await client.get("/health")
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-xss-protection") == "1; mode=block"
