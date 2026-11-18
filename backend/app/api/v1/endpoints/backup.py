"""
Mettu Karl Referral Hospital HMIS — Database Backup & Disaster Recovery Endpoints.
Compliant with Ethiopian INSA Health Cyber Standards, ISO 27001 & HIPAA.

Enforces Super Admin RBAC for database snapshot creation, SHA-256 seal verification,
isolated disaster recovery restoration testing, and RPO/RTO telemetry.
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.api.deps import require_admin, require_roles
from app.models.user import User, UserRole
from app.services.backup_service import backup_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/list", summary="List All Backup Archives & Integrity Seals")
async def list_backups(
    current_user: User = Depends(require_admin),
) -> List[Dict[str, Any]]:
    """
    Retrieve list of all cryptographic backup archives stored in repository,
    including SHA-256 integrity hash, file size, timestamp, and verification status.
    """
    try:
        return await backup_service.list_backups()
    except Exception as e:
        logger.error(f"Error listing backups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list backups: {str(e)}",
        )


@router.post("/create", summary="Trigger Immediate Automated Database Backup")
async def create_backup(
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
) -> Dict[str, Any]:
    """
    Trigger immediate consistent database dump, compressed with gzip,
    sealed with SHA-256 cryptographic hash, and structured with metadata manifest.
    """
    try:
        manifest = await backup_service.create_backup(triggered_by=current_user.username)
        return {
            "status": "SUCCESS",
            "message": "Database backup completed and cryptographically sealed.",
            "manifest": manifest,
        }
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database backup failed: {str(e)}",
        )


@router.post("/verify", summary="Test Disaster Recovery Restoration in Isolated Sandbox")
async def verify_backup(
    filename: Optional[str] = Query(None, description="Optional specific backup archive to test"),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
) -> Dict[str, Any]:
    """
    Run automated disaster recovery restore verification:
    1. Validates SHA-256 checksum integrity against recorded seal.
    2. Tests archive stream decompression without corruption.
    3. Runs isolated dry-run restoration & schema catalog consistency checks.
    4. Computes Recovery Time Objective (RTO) metrics.
    """
    try:
        report = await backup_service.verify_backup(filename)
        return {
            "status": "SUCCESS",
            "message": "Disaster recovery verification completed successfully.",
            "report": report,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disaster recovery verification failed: {str(e)}",
        )


@router.get("/posture", summary="Hospital Disaster Recovery & RPO/RTO Telemetry")
async def get_disaster_recovery_posture(
    current_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Retrieve complete hospital Disaster Recovery Posture:
    - Recovery Point Objective (RPO) status & age
    - Recovery Time Objective (RTO) measured in seconds
    - Available archive summaries & cryptographic integrity state
    - Ethiopian INSA / ISO 27001 healthcare compliance certification
    """
    try:
        return await backup_service.get_disaster_recovery_posture()
    except Exception as e:
        logger.error(f"Error fetching DR posture: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch DR posture: {str(e)}",
        )


@router.get("/download/{filename}", summary="Download Cryptographic Backup Archive")
async def download_backup(
    filename: str,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> FileResponse:
    """
    Strictly Super Admin protected download for offsite disaster recovery archival.
    Enforces path traversal protection and secure headers.
    """
    file_path = backup_service.get_backup_path(filename)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested backup archive does not exist or has been pruned.",
        )

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="application/gzip",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "X-Content-Type-Options": "nosniff",
        },
    )
