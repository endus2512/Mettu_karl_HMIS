"""
Tests for Ethiopian INSA National Cybersecurity Standards,
Cryptographic Merkle Hash Chain Audit Trails, and High Availability Cluster Telemetry.
"""
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import compute_audit_hash, record_audit_event, verify_audit_chain
from app.models.audit_log import AuditLog


@pytest.mark.asyncio
async def test_insa_merkle_audit_hash_chain_creation_and_verification(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    doctor_auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """
    Test that audit events form a continuous cryptographic hash chain (Merkle DAG)
    where each record's hash depends on the preceding entry's hash.
    """
    # 1. Record series of sensitive clinical actions
    log1 = await record_audit_event(
        db_session,
        user_id=1,
        action="LOGIN_MFA_SUCCESS",
        resource="UserSession",
        resource_id="session-001",
        ip_address="192.168.1.50",
        result="success",
        detail={"method": "TOTP_AUTHENTICATOR", "device": "Hospital Workstation 12"},
    )
    await db_session.commit()

    log2 = await record_audit_event(
        db_session,
        user_id=1,
        action="NARCOTIC_PRESCRIPTION_DISPENSED",
        resource="Prescription",
        resource_id="RX-NARCOTIC-991",
        ip_address="192.168.1.50",
        result="success",
        detail={"drug": "Morphine 10mg/mL", "dose": "5mg IV", "witness_id": 2},
    )
    await db_session.commit()

    log3 = await record_audit_event(
        db_session,
        user_id=1,
        action="CLINICAL_CODE_BLUE_DECLARED",
        resource="EmergencyDepartment",
        resource_id="BAY-01",
        ip_address="192.168.1.50",
        result="success",
        detail={"reason": "Cardiac Arrest in Trauma Bay"},
    )
    await db_session.commit()

    # Verify link chain in DB
    assert log1.entry_hash is not None
    assert log1.previous_hash == "0" * 64  # Genesis
    assert log1.chain_index == 1

    assert log2.previous_hash == log1.entry_hash
    assert log2.chain_index == 2

    assert log3.previous_hash == log2.entry_hash
    assert log3.chain_index == 3

    # 2. Verify chain via service
    verify_result = await verify_audit_chain(db_session)
    assert verify_result["is_valid"] is True
    assert verify_result["status"] == "VERIFIED_TAMPER_FREE"
    assert verify_result["total_records_checked"] >= 3

    # 3. Verify via HTTP API endpoint (Admin only; clinicians blocked)
    denied = await client.get("/api/v1/clinical-audit/security/verify-chain", headers=doctor_auth_headers)
    assert denied.status_code == 403

    api_res = await client.get("/api/v1/clinical-audit/security/verify-chain", headers=admin_auth_headers)
    assert api_res.status_code == 200
    api_data = api_res.json()
    assert api_data["is_valid"] is True
    assert api_data["status"] == "VERIFIED_TAMPER_FREE"
    assert "INSA" in api_data["compliance_standard"]


@pytest.mark.asyncio
async def test_insa_merkle_audit_detects_deliberate_tampering(
    db_session: AsyncSession,
):
    """
    Test that tampering with even a single field in an existing audit log row
    (such as a malicious DBA altering a malpractice log) is immediately detected.
    """
    # 1. Create 2 valid entries
    log1 = await record_audit_event(
        db_session,
        user_id=1,
        action="PRESCRIBE_MEDICATION",
        resource="Prescription",
        resource_id="RX-101",
        detail={"drug": "Amoxicillin 500mg"},
    )
    await db_session.commit()

    log2 = await record_audit_event(
        db_session,
        user_id=1,
        action="DISPENSE_MEDICATION",
        resource="Prescription",
        resource_id="RX-101",
        detail={"quantity": 21},
    )
    await db_session.commit()

    # Verify valid before tampering
    initial_check = await verify_audit_chain(db_session)
    assert initial_check["is_valid"] is True

    # 2. Deliberately tamper with log1 (Simulate malicious database modification)
    stmt = select(AuditLog).where(AuditLog.id == log1.id)
    tampered_entry = (await db_session.execute(stmt)).scalar_one()
    tampered_entry.detail = '{"drug": "Forged Fentanyl 100mcg"}'  # Malicious alteration!
    await db_session.commit()

    # 3. Re-run verification: Tampering MUST be detected!
    tamper_check = await verify_audit_chain(db_session)
    assert tamper_check["is_valid"] is False
    assert tamper_check["status"] == "TAMPERING_DETECTED"
    assert tamper_check["broken_at_id"] == log1.id
    assert tamper_check["tampering_type"] == "DATA_PAYLOAD_TAMPERED"


@pytest.mark.asyncio
async def test_ha_cluster_telemetry_endpoint(
    client: AsyncClient,
):
    """
    Test database high availability cluster monitoring endpoint.
    Reports primary/replica role, zero-downtime SLA, and replication telemetry.
    """
    res = await client.get("/api/v1/cluster")
    assert res.status_code == 200
    data = res.json()
    assert data["cluster_name"] == "mettu-karl-ha-cluster"
    assert data["node_role"] in ["PRIMARY_MASTER", "STANDBY_REPLICA"]
    assert data["cluster_health"] == "OPTIMAL_HA"
    assert data["high_availability"]["failover_mode"] == "AUTOMATIC_RAFT_CONSENSUS"
    assert data["high_availability"]["failover_target_time_seconds"] <= 3.0
    assert "99.999%" in data["high_availability"]["zero_downtime_sla"]
    assert data["replication"]["mode"] == "SYNCHRONOUS_STREAMING"
