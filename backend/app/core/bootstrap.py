"""
Idempotent database schema creation and baseline seeding.

Ensures SQLite / PostgreSQL tables, audit columns, and default staff/signage
records exist both on ASGI lifespan startup and on cold serverless invocations
such as Vercel Python Functions.
"""
import asyncio

from sqlalchemy import inspect, select, text
from sqlalchemy.exc import IntegrityError

_db_init_lock = asyncio.Lock()
_db_initialized = False


async def ensure_database_ready() -> None:
    """Create missing tables/columns and seed default accounts/signage idempotently."""
    global _db_initialized
    if _db_initialized:
        return

    async with _db_init_lock:
        if _db_initialized:
            return

        from app.core.database import AsyncSessionLocal, engine
        from app.core.security import hash_password
        from app.models import Base  # noqa: F401 - ensures all models are registered
        from app.models.hrm import HospitalSignageConfig
        from app.models.user import User, UserRole

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

            def _ensure_audit_columns(sync_conn) -> None:
                inspector = inspect(sync_conn)
                if not inspector.has_table("audit_logs"):
                    return
                existing = {col["name"] for col in inspector.get_columns("audit_logs")}
                additions = [
                    ("entry_hash", "VARCHAR(64)"),
                    ("previous_hash", "VARCHAR(64)"),
                    ("chain_index", "INTEGER"),
                    ("signature_seal", "VARCHAR(128)"),
                ]
                for col_name, col_type in additions:
                    if col_name not in existing:
                        sync_conn.execute(text(f"ALTER TABLE audit_logs ADD COLUMN {col_name} {col_type}"))

            await conn.run_sync(_ensure_audit_columns)

            def _ensure_user_columns(sync_conn) -> None:
                inspector = inspect(sync_conn)
                if not inspector.has_table("users"):
                    return
                existing = {col["name"] for col in inspector.get_columns("users")}
                additions = [
                    ("staff_id", "VARCHAR(64)"),
                    ("department", "VARCHAR(100)"),
                    ("license_number", "VARCHAR(100)"),
                    ("approval_status", "VARCHAR(20) NOT NULL DEFAULT 'approved'"),
                    ("requested_role", "VARCHAR(50)"),
                    ("rejection_reason", "VARCHAR(255)"),
                    ("risk_flag", "VARCHAR(100)"),
                    ("approved_by", "INTEGER"),
                    ("approved_at", "TIMESTAMP"),
                    ("requested_ip", "VARCHAR(64)"),
                    ("first_login_at", "TIMESTAMP"),
                    ("last_seen_at", "TIMESTAMP"),
                    ("last_ip", "VARCHAR(64)"),
                    ("last_activity_path", "VARCHAR(255)"),
                    ("pending_wait_jti", "VARCHAR(64)"),
                ]
                for col_name, col_type in additions:
                    if col_name not in existing:
                        sync_conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

            await conn.run_sync(_ensure_user_columns)

        async with AsyncSessionLocal() as db:
            try:
                existing_user = (await db.execute(select(User.id).limit(1))).scalar_one_or_none()
                if existing_user is None:
                    default_users = [
                        ("admin", "admin@mettukarl.gov.et", "Hospital System Administrator", "AdminSecurePassword2026!", UserRole.SUPER_ADMIN),
                        ("dr_bekele", "dr.bekele@mettukarl.gov.et", "Dr. Bekele Tadesse", "DoctorPassword2026!", UserRole.DOCTOR),
                        ("nurse_chaltu", "nurse.chaltu@mettukarl.gov.et", "Nurse Chaltu Abera", "NursePassword2026!", UserRole.NURSE),
                        ("lab_tech_gemechu", "gemechu.lab@mettukarl.gov.et", "Gemechu Desta", "LabPassword2026!", UserRole.LAB_TECH),
                        ("pharm_solomon", "solomon.pharm@mettukarl.gov.et", "Solomon Kassa", "PharmPassword2026!", UserRole.PHARMACIST),
                        ("reception_almaz", "almaz.rec@mettukarl.gov.et", "Almaz Worku", "ReceptionPassword2026!", UserRole.RECEPTIONIST),
                    ]
                    for uname, uemail, fname, pwd, urole in default_users:
                        db.add(
                            User(
                                username=uname,
                                email=uemail,
                                full_name=fname,
                                hashed_password=hash_password(pwd),
                                role=urole,
                                is_active=True,
                            )
                        )
                    await db.commit()
            except IntegrityError:
                await db.rollback()

            try:
                existing_patient_usernames = set(
                    (
                        await db.execute(
                            select(User.username).where(User.username.in_(["pat_gudeta", "pat_chaltu"]))
                        )
                    )
                    .scalars()
                    .all()
                )
                default_patients = [
                    (
                        "pat_gudeta",
                        "pat_gudeta@patient.mettukarl.gov.et",
                        "Gudeta Hailu Tadesse",
                        "PatientPass2026!",
                        1,
                        "FAN-9901-2384-5120",
                        "+251911002233",
                    ),
                    (
                        "pat_chaltu",
                        "pat_chaltu@patient.mettukarl.gov.et",
                        "Chaltu Daba Tolasa",
                        "PatientPass2026!",
                        2,
                        "FAN-7721-9981-3310",
                        "+251922445566",
                    ),
                ]
                added_patient_users = False
                for uname, uemail, fname, pwd, pat_id, fayda, phone in default_patients:
                    if uname not in existing_patient_usernames:
                        db.add(
                            User(
                                username=uname,
                                email=uemail,
                                full_name=fname,
                                hashed_password=hash_password(pwd),
                                role=UserRole.PATIENT,
                                patient_id=pat_id,
                                fayda_id=fayda,
                                phone_number=phone,
                                is_active=True,
                            )
                        )
                        added_patient_users = True
                if added_patient_users:
                    await db.commit()
            except IntegrityError:
                await db.rollback()

            try:
                existing_signage = (
                    await db.execute(select(HospitalSignageConfig.id).limit(1))
                ).scalar_one_or_none()
                if existing_signage is None:
                    db.add(
                        HospitalSignageConfig(
                            message="METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL",
                            color_preset="amber_yellow",
                            color_hex="#ffb800",
                            speed=1.0,
                            font_scale=1.0,
                            letter_spacing=0.12,
                            glow_intensity=80,
                            show_grid_dots=True,
                            show_scanlines=True,
                            is_playing=True,
                            direction="rtl",
                            offset_y=0,
                            updated_by="System Default",
                        )
                    )
                    await db.commit()
            except IntegrityError:
                await db.rollback()

        _db_initialized = True
