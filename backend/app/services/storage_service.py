"""
MinIO Object Storage service for medical imagery, lab reports, and documents.
"""
from datetime import timedelta
import io
import logging
from typing import BinaryIO, Optional

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """MinIO S3-compatible client wrapper."""

    def __init__(self) -> None:
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> None:
        """Create bucket if it doesn't already exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket '{self.bucket_name}'")
        except Exception as e:
            logger.warning(f"Could not connect to MinIO during startup: {e}")

    def upload_file(
        self,
        object_name: str,
        file_data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload binary data to object storage.

        Returns:
            Object key / path
        """
        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=file_data,
            length=length,
            content_type=content_type,
        )
        return object_name

    def get_presigned_download_url(self, object_name: str, expires_minutes: int = 60) -> str:
        """Generate temporary presigned URL for secure access."""
        return self.client.presigned_get_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            expires=timedelta(minutes=expires_minutes),
        )

    def remove_file(self, object_name: str) -> None:
        """Delete an object from storage."""
        self.client.remove_object(self.bucket_name, object_name)


# Lazy singleton instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
