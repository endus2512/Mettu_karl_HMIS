"""
PACS (Picture Archiving and Communication System) & RIS ORM models.
Indexes DICOM metadata and object storage references for X-Ray, CT, MRI, and Ultrasound studies.
"""
from datetime import datetime, timezone
import enum
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ModalityType(str, enum.Enum):
    XRAY = "CR"          # Computed Radiography / General X-Ray
    DIGITAL_XRAY = "DX"  # Digital Radiography
    CT = "CT"            # Computed Tomography
    MRI = "MR"           # Magnetic Resonance Imaging
    ULTRASOUND = "US"    # Ultrasound


class RadiologyStatus(str, enum.Enum):
    ORDERED = "ordered"
    IMAGE_ACQUIRED = "image_acquired"
    REPORTED = "reported"
    VERIFIED = "verified"


class RadiologyOrder(Base):
    """Physician order for diagnostic imaging study."""
    __tablename__ = "radiology_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    ordering_doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    modality: Mapped[ModalityType] = mapped_column(
        Enum(ModalityType, name="modality_type_enum", native_enum=False),
        nullable=False,
    )
    body_part: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Chest", "Pelvis", "Head"
    clinical_indication: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[RadiologyStatus] = mapped_column(
        Enum(RadiologyStatus, name="radiology_status_enum", native_enum=False),
        default=RadiologyStatus.ORDERED,
        nullable=False,
    )
    ordered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    study: Mapped[Optional["DICOMStudy"]] = relationship("DICOMStudy", back_populates="order", uselist=False)


class DICOMStudy(Base):
    """Top-level DICOM Study instance containing series and imaging slices."""
    __tablename__ = "dicom_studies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    study_instance_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    radiology_order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("radiology_orders.id", ondelete="SET NULL"), unique=True, nullable=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)

    modality: Mapped[ModalityType] = mapped_column(
        Enum(ModalityType, name="study_modality_enum", native_enum=False),
        nullable=False,
    )
    study_description: Mapped[str] = mapped_column(String(255), nullable=False)
    study_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    # Radiologist findings
    radiologist_report: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reporting_doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped[Optional["RadiologyOrder"]] = relationship("RadiologyOrder", back_populates="study")
    series: Mapped[list["DICOMSeries"]] = relationship("DICOMSeries", back_populates="study", cascade="all, delete-orphan")


class DICOMSeries(Base):
    """DICOM Series within a Study (e.g. Axial, Coronal, Sagittal)."""
    __tablename__ = "dicom_series"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("dicom_studies.id", ondelete="CASCADE"), index=True)
    series_instance_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    series_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    series_description: Mapped[str] = mapped_column(String(200), default="Standard View", nullable=False)

    instances: Mapped[list["DICOMInstance"]] = relationship("DICOMInstance", back_populates="series", cascade="all, delete-orphan")
    study: Mapped["DICOMStudy"] = relationship("DICOMStudy", back_populates="series")


class DICOMInstance(Base):
    """Individual DICOM file slice stored in MinIO object storage."""
    __tablename__ = "dicom_instances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    series_id: Mapped[int] = mapped_column(ForeignKey("dicom_series.id", ondelete="CASCADE"), index=True)
    sop_instance_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    instance_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # MinIO / S3 Storage reference
    storage_bucket: Mapped[str] = mapped_column(String(100), default="mettu-karl-his", nullable=False)
    storage_object_key: Mapped[str] = mapped_column(String(500), nullable=False) # e.g. pacs/studies/UID/instance.dcm
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    series: Mapped["DICOMSeries"] = relationship("DICOMSeries", back_populates="instances")
