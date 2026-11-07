"""
Seed initial clinical prescriptions into Mettu Karl HMIS SQLite database.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.models.pharmacy import (
    Drug,
    DrugBatch,
    MovementType,
    Prescription,
    PrescriptionItem,
    PrescriptionStatus,
    StockMovement,
)

async def seed_prescriptions():
    async with AsyncSessionLocal() as session:
        # Check if prescriptions already seeded
        existing_rx = await session.execute(select(Prescription))
        if existing_rx.scalars().first():
            print("Prescriptions already seeded. Skipping.")
            return

        # Fetch patients
        p1 = (await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000101"))).scalar_one_or_none()
        p2 = (await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000102"))).scalar_one_or_none()
        if not p1 or not p2:
            print("Patients not found! Please run seed_dev.py first.")
            return

        # Fetch prescriber doctor
        dr = (await session.execute(select(User).where(User.username == "dr_bekele"))).scalar_one_or_none()
        pharm = (await session.execute(select(User).where(User.username == "pharm_solomon"))).scalar_one_or_none()
        if not dr:
            dr = (await session.execute(select(User).where(User.role == UserRole.SUPER_ADMIN))).scalar_one_or_none()
        if not pharm:
            pharm = dr

        # Fetch drugs
        amox = (await session.execute(select(Drug).where(Drug.name.ilike("%Amoxicillin%")))).scalar_one_or_none()
        para = (await session.execute(select(Drug).where(Drug.name.ilike("%Paracetamol%")))).scalar_one_or_none()
        ceft = (await session.execute(select(Drug).where(Drug.name.ilike("%Ceftriaxone%")))).scalar_one_or_none()
        ibup = (await session.execute(select(Drug).where(Drug.name.ilike("%Ibuprofen%")))).scalar_one_or_none()
        metf = (await session.execute(select(Drug).where(Drug.name.ilike("%Metformin%")))).scalar_one_or_none()

        now = datetime.now(timezone.utc)

        # 1. PENDING RX 1: Gudeta Hailu
        rx1 = Prescription(
            prescription_code="RX-MKH-901",
            patient_id=p1.id,
            prescriber_id=dr.id,
            status=PrescriptionStatus.PENDING,
            clinical_notes="Acute bacterial bronchitis. Patient has mild fever and productive cough. Monitor for allergic response.",
            created_at=now - timedelta(minutes=45),
        )
        session.add(rx1)
        await session.flush()

        item1_1 = PrescriptionItem(
            prescription_id=rx1.id,
            drug_id=amox.id,
            dosage="500mg (1 capsule)",
            frequency="TID (Three times daily)",
            duration_days=7,
            quantity_prescribed=21,
            quantity_dispensed=0,
            instructions="Take after meals with a full glass of water.",
        )
        item1_2 = PrescriptionItem(
            prescription_id=rx1.id,
            drug_id=para.id,
            dosage="500mg (1 tablet)",
            frequency="TID (Every 8 hours PRN)",
            duration_days=5,
            quantity_prescribed=15,
            quantity_dispensed=0,
            instructions="Take for pain and temperature exceeding 38°C.",
        )
        session.add_all([item1_1, item1_2])

        # 2. PENDING RX 2: Ayantu Mamo
        rx2 = Prescription(
            prescription_code="RX-MKH-902",
            patient_id=p2.id,
            prescriber_id=dr.id,
            status=PrescriptionStatus.PENDING,
            clinical_notes="Severe pelvic inflammatory infection. Urgent antimicrobial therapy required.",
            created_at=now - timedelta(minutes=20),
        )
        session.add(rx2)
        await session.flush()

        item2_1 = PrescriptionItem(
            prescription_id=rx2.id,
            drug_id=ceft.id,
            dosage="1g (1 vial)",
            frequency="Once daily (OD) IV Infusion",
            duration_days=5,
            quantity_prescribed=5,
            quantity_dispensed=0,
            instructions="Administer via slow intravenous infusion over 30 minutes in Procedure Room.",
        )
        item2_2 = PrescriptionItem(
            prescription_id=rx2.id,
            drug_id=ibup.id,
            dosage="400mg (1 tablet)",
            frequency="TID with food",
            duration_days=5,
            quantity_prescribed=15,
            quantity_dispensed=0,
            instructions="Take after food to protect gastric lining.",
        )
        session.add_all([item2_1, item2_2])

        # 3. DISPENSED RX 3: Gudeta Hailu (Metformin)
        rx3 = Prescription(
            prescription_code="RX-MKH-880",
            patient_id=p1.id,
            prescriber_id=dr.id,
            status=PrescriptionStatus.DISPENSED,
            clinical_notes="Type 2 Diabetes maintenance therapy. Fasting glucose stable at 118 mg/dL.",
            created_at=now - timedelta(days=2),
            dispensed_at=now - timedelta(days=2, hours=1),
        )
        session.add(rx3)
        await session.flush()

        metf_batch = (await session.execute(
            select(DrugBatch).where(DrugBatch.drug_id == metf.id).order_by(DrugBatch.expiry_date.asc())
        )).scalars().first()

        item3_1 = PrescriptionItem(
            prescription_id=rx3.id,
            drug_id=metf.id,
            batch_id=metf_batch.id if metf_batch else None,
            dosage="500mg (1 tablet)",
            frequency="BID (Twice daily with meals)",
            duration_days=30,
            quantity_prescribed=60,
            quantity_dispensed=60,
            instructions="Take morning and evening with breakfast and dinner.",
        )
        session.add(item3_1)

        if metf_batch:
            movement = StockMovement(
                drug_id=metf.id,
                batch_id=metf_batch.id,
                movement_type=MovementType.DISPENSE,
                quantity=-60,
                balance_after=metf_batch.current_quantity,
                reference_number=f"Rx-{rx3.id}",
                user_id=pharm.id if pharm else None,
            )
            session.add(movement)

        await session.commit()
        print("Successfully seeded 3 realistic prescriptions (2 PENDING, 1 DISPENSED) into database!")

if __name__ == "__main__":
    asyncio.run(seed_prescriptions())
