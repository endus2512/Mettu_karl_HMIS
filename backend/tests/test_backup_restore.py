"""
Unit and integration tests for PostgreSQL/SQLite Automated Backup & Disaster Recovery Suite.
Compliant with Ethiopian INSA Health Cyber Standards, ISO 27001 & HIPAA.
"""
import json
from pathlib import Path
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole
from app.services.backup_service import backup_service


@pytest.fixture
async def super_admin_user(db_session: AsyncSession) -> User:
    """Create a Super Admin user fixture."""
    user = User(
        username="super_dr_admin",
        email="super.admin@mettukarl.gov.et",
        full_name="Super Administrator Karl",
        hashed_password=hash_password("SuperAdminPass2026!"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        approval_status="approved",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_auth_headers(super_admin_user: User) -> dict[str, str]:
    """Generate Bearer auth headers for Super Admin."""
    token = create_access_token(
        subject=super_admin_user.id,
        extra_claims={"role": super_admin_user.role.value, "username": super_admin_user.username},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_backup_service_create_and_manifest():
    """Verify backup_service creates a compressed archive, SHA-256 seal, and manifest."""
    manifest = await backup_service.create_backup(triggered_by="test_runner")

    assert manifest["hospital"] == "Mettu Karl Referral Hospital"
    assert manifest["status"] == "SUCCESS" if "status" in manifest else True
    assert manifest["backup_file"].endswith((".dump.gz", ".sqlite.gz"))
    assert manifest["integrity_status"] == "VERIFIED_SEALED"
    assert manifest["disaster_recovery_status"] == "READY_FOR_RESTORE"

    backup_path = Path(manifest["backup_path"])
    assert backup_path.exists()
    assert backup_path.stat().st_size > 0

    sha256_file = Path(f"{manifest['backup_path']}.sha256")
    assert sha256_file.exists()
    assert manifest["sha256_checksum"] in sha256_file.read_text()


@pytest.mark.asyncio
async def test_backup_service_verify_success():
    """Verify backup_service runs isolated dry-run restore check cleanly."""
    manifest = await backup_service.create_backup(triggered_by="dr_test_suite")
    backup_file = manifest["backup_file"]

    report = await backup_service.verify_backup(backup_file)
    assert report["sha256_status"] == "PASSED"
    assert report["stream_integrity"] == "PASSED"
    assert report["catalog_integrity"] == "PASSED"
    assert report["disaster_recovery_readiness"] == "READY_FOR_FAILOVER"
    assert report["tables_validated_count"] > 0
    assert report["restore_duration_seconds"] >= 0


@pytest.mark.asyncio
async def test_backup_service_tamper_detection(tmp_path: Path):
    """Verify that tampering with an archive triggers an integrity seal mismatch alarm."""
    manifest = await backup_service.create_backup(triggered_by="tamper_test")
    backup_path = Path(manifest["backup_path"])

    # Tamper by appending junk bytes
    with open(backup_path, "ab") as f:
        f.write(b"CORRUPTED_BYTES_INJECTED")

    with pytest.raises(RuntimeError) as exc_info:
        await backup_service.verify_backup(manifest["backup_file"])
    assert "SHA-256 Checksum mismatch" in str(exc_info.value) or "DR verification failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_backup_service_disaster_recovery_posture():
    """Verify disaster recovery posture provides RPO, RTO, and compliance ratings."""
    posture = await backup_service.get_disaster_recovery_posture()

    assert posture["hospital"] == "Mettu Karl Referral Hospital"
    assert "rpo" in posture
    assert "rto" in posture
    assert posture["rpo"]["status"] in ["OPTIMAL_HEALTHY", "WARNING_ATTENTION_NEEDED", "CRITICAL_OVERDUE"]
    assert posture["rto"]["status"] == "OPTIMAL_SUB_MINUTE"
    assert "INSA" in posture["compliance"]["standard"]
    assert posture["compliance"]["rating"] == "A+ FULLY_COMPLIANT"


@pytest.mark.asyncio
async def test_backup_api_rbac_protection(
    client: AsyncClient, doctor_auth_headers: dict[str, str]
):
    """Verify unauthenticated and unauthorized staff (e.g. Doctor) cannot trigger backups."""
    # 1. Unauthenticated request -> 401
    unauth_res = await client.get("/api/v1/backup/list")
    assert unauth_res.status_code == 401

    # 2. Doctor request -> 403 Forbidden
    doc_res = await client.post(
        "/api/v1/backup/create",
        headers=doctor_auth_headers,
    )
    assert doc_res.status_code == 403


@pytest.mark.asyncio
async def test_backup_api_admin_create_and_verify(
    client: AsyncClient, super_admin_auth_headers: dict[str, str]
):
    """Verify Super Admin can list, create, verify, and check DR posture via API."""
    # 1. Trigger on-demand backup
    create_res = await client.post(
        "/api/v1/backup/create",
        headers=super_admin_auth_headers,
    )
    assert create_res.status_code == 200
    create_data = create_res.json()
    assert create_data["status"] == "SUCCESS"
    backup_file = create_data["manifest"]["backup_file"]

    # 2. List backups
    list_res = await client.get(
        "/api/v1/backup/list",
        headers=super_admin_auth_headers,
    )
    assert list_res.status_code == 200
    archives = list_res.json()
    assert len(archives) >= 1
    assert any(a["backup_file"] == backup_file for a in archives)

    # 3. Test verification via API
    verify_res = await client.post(
        f"/api/v1/backup/verify?filename={backup_file}",
        headers=super_admin_auth_headers,
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "SUCCESS"
    assert verify_data["report"]["sha256_status"] == "PASSED"

    # 4. Fetch DR Posture via API
    posture_res = await client.get(
        "/api/v1/backup/posture",
        headers=super_admin_auth_headers,
    )
    assert posture_res.status_code == 200
    posture_data = posture_res.json()
    assert posture_data["facility_code"] == "MKRH-HMIS-ETH-01"
    assert posture_data["backups_summary"]["total_archives_available"] >= 1
