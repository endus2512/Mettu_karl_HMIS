"""
Seed realistic patient invoices, items, payments, and CBHI policies into Mettu Karl HMIS.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.billing import (
    CBHIPolicy,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    Payment,
    PaymentMethod,
    PaymentStatus,
)
from app.models.patient import Patient

async def seed_billing():
    async with AsyncSessionLocal() as session:
        # Check if invoices already seeded
        existing = await session.execute(select(Invoice))
        if existing.scalars().first():
            print("Invoices already seeded. Skipping.")
            return

        # Fetch patients
        p1 = (await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000101"))).scalar_one_or_none()
        p2 = (await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000102"))).scalar_one_or_none()

        if not p1 or not p2:
            print("Patients not found! Please run seed_dev.py first.")
            return

        now = datetime.now(timezone.utc)
        today = date.today()

        # 1. Seed CBHI Policy for Gudeta Hailu
        cbhi_policy = CBHIPolicy(
            patient_id=p1.id,
            household_number="HH-METTU-9924",
            kebele="Kebele 01",
            woreda="Mettu Town",
            expiry_date=today + timedelta(days=300),
            co_pay_percentage=10.0,  # 10% co-pay, 90% government subsidy
            is_active=True,
        )
        session.add(cbhi_policy)
        await session.flush()
        print(f"  + Enrolled CBHI Policy for {p1.first_name} {p1.last_name}: {cbhi_policy.household_number}")

        # 2. Invoice 1: Gudeta Hailu (PAID via Telebirr)
        inv1 = Invoice(
            invoice_number="INV-2026-000101",
            patient_id=p1.id,
            total_amount=652.0,
            insurance_covered_amount=586.80,
            patient_payable_amount=65.20,
            paid_amount=65.20,
            status=InvoiceStatus.PAID,
            notes="OPD consultation and initial bronchitis medication package. 90% CBHI waiver applied.",
            created_at=now - timedelta(days=1, hours=3),
        )
        session.add(inv1)
        await session.flush()

        item1_1 = InvoiceItem(invoice_id=inv1.id, service_name="General OPD Medical Consultation", service_code="OPD-CONS-01", quantity=1, unit_price=150.0, total_price=150.0)
        item1_2 = InvoiceItem(invoice_id=inv1.id, service_name="Complete Blood Count (CBC) Hematology", service_code="LAB-CBC-02", quantity=1, unit_price=250.0, total_price=250.0)
        item1_3 = InvoiceItem(invoice_id=inv1.id, service_name="Amoxicillin 500mg Capsules (21 units)", service_code="PHARM-AMOX-21", quantity=1, unit_price=252.0, total_price=252.0)
        session.add_all([item1_1, item1_2, item1_3])

        payment1 = Payment(
            invoice_id=inv1.id,
            amount=65.20,
            payment_method=PaymentMethod.TELEBIRR,
            transaction_reference="TB-261106-992384A1",
            status=PaymentStatus.SUCCESS,
            payer_phone="+251911002233",
            notes="Telebirr QR payment settled at Cashier Station 01",
            created_at=now - timedelta(days=1, hours=2, minutes=50),
        )
        session.add(payment1)

        # 3. Invoice 2: Ayantu Mamo (PENDING - Emergency / Private Cash)
        inv2 = Invoice(
            invoice_number="INV-2026-000102",
            patient_id=p2.id,
            total_amount=895.0,
            insurance_covered_amount=0.0,
            patient_payable_amount=895.0,
            paid_amount=0.0,
            status=InvoiceStatus.PENDING,
            notes="Emergency post-op antimicrobial therapy and nursing observation.",
            created_at=now - timedelta(hours=2),
        )
        session.add(inv2)
        await session.flush()

        item2_1 = InvoiceItem(invoice_id=inv2.id, service_name="Emergency Observation & Resuscitation Bed", service_code="EMR-OBS-01", quantity=1, unit_price=350.0, total_price=350.0)
        item2_2 = InvoiceItem(invoice_id=inv2.id, service_name="Ceftriaxone 1g Injection (5 vials)", service_code="PHARM-CEFT-05", quantity=1, unit_price=425.0, total_price=425.0)
        item2_3 = InvoiceItem(invoice_id=inv2.id, service_name="IV Infusion Set & Normal Saline 500ml", service_code="CONS-IV-01", quantity=1, unit_price=120.0, total_price=120.0)
        session.add_all([item2_1, item2_2, item2_3])

        # 4. Invoice 3: Gudeta Hailu (PENDING - Diabetes Refill with CBHI)
        inv3 = Invoice(
            invoice_number="INV-2026-000103",
            patient_id=p1.id,
            total_amount=610.0,
            insurance_covered_amount=549.0,
            patient_payable_amount=61.0,
            paid_amount=0.0,
            status=InvoiceStatus.PENDING,
            notes="Monthly chronic care refill (Type 2 Diabetes). 90% CBHI waiver applied.",
            created_at=now - timedelta(minutes=45),
        )
        session.add(inv3)
        await session.flush()

        item3_1 = InvoiceItem(invoice_id=inv3.id, service_name="Chronic Disease Specialist Consultation", service_code="OPD-CHRONIC-01", quantity=1, unit_price=100.0, total_price=100.0)
        item3_2 = InvoiceItem(invoice_id=inv3.id, service_name="Fasting Blood Glucose (FBG) Lab Test", service_code="LAB-GLU-01", quantity=1, unit_price=120.0, total_price=120.0)
        item3_3 = InvoiceItem(invoice_id=inv3.id, service_name="Metformin 500mg Tablets (60 units)", service_code="PHARM-METF-60", quantity=1, unit_price=390.0, total_price=390.0)
        session.add_all([item3_1, item3_2, item3_3])

        await session.commit()
        print("Successfully seeded billing data: 1 CBHI Policy, 3 Invoices (1 PAID, 2 PENDING), and itemized records!")

if __name__ == "__main__":
    asyncio.run(seed_billing())
