"""
Laboratory Information System (LIS) Database Table Seeder.
Creates lab_test_catalog, lab_orders, lab_order_items, and lab_results.
Populates standard clinical diagnostic panels, LOINC codes, reference intervals,
and real active patient requisitions with abnormal & critical panic findings.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import json
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, Base, engine
from app.models.laboratory import (
    LabCategory,
    LabOrder,
    LabOrderItem,
    LabOrderPriority,
    LabOrderStatus,
    LabResult,
    LabTestCatalog,
    ResultFlag,
    SpecimenType,
)
from app.models.patient import Gender, Patient
from app.models.user import User, UserRole


CLINICAL_PANELS = [
    {
        "test_code": "CBC_DIFF",
        "test_name": "Complete Blood Count (CBC) with 5-Part Differential",
        "name_om": "Qorannoo Dhiigaa Guutuu (CBC)",
        "category": LabCategory.HEMATOLOGY,
        "specimen_type": SpecimenType.WHOLE_BLOOD_EDTA,
        "tube_color": "Lavender / Purple Top (K2-EDTA)",
        "loinc_code": "58410-2",
        "price_etb": 180.0,
        "turnaround_time_mins": 30,
        "parameters": [
            {"name": "Hemoglobin (Hgb)", "unit": "g/dL", "reference_range": "12.0 - 17.5", "min_ref": 12.0, "max_ref": 17.5, "critical_low": 7.0, "critical_high": 20.0},
            {"name": "White Blood Cell Count (WBC)", "unit": "x10³/µL", "reference_range": "4.0 - 11.0", "min_ref": 4.0, "max_ref": 11.0, "critical_low": 2.0, "critical_high": 30.0},
            {"name": "Platelet Count (PLT)", "unit": "x10³/µL", "reference_range": "150 - 450", "min_ref": 150.0, "max_ref": 450.0, "critical_low": 50.0, "critical_high": 1000.0},
            {"name": "Hematocrit (Hct)", "unit": "%", "reference_range": "36.0 - 52.0", "min_ref": 36.0, "max_ref": 52.0, "critical_low": 21.0, "critical_high": 60.0},
            {"name": "Red Blood Cell Count (RBC)", "unit": "x10⁶/µL", "reference_range": "4.2 - 5.9", "min_ref": 4.2, "max_ref": 5.9, "critical_low": 2.5, "critical_high": 6.8},
            {"name": "Neutrophils %", "unit": "%", "reference_range": "40 - 75", "min_ref": 40.0, "max_ref": 75.0},
            {"name": "Lymphocytes %", "unit": "%", "reference_range": "20 - 45", "min_ref": 20.0, "max_ref": 45.0},
        ],
    },
    {
        "test_code": "BF_MALARIA",
        "test_name": "Blood Film for Hemoparasites (Malaria Giemsa)",
        "name_om": "Qorannoo Busaa Dhiigaa (Blood Film)",
        "category": LabCategory.HEMATOLOGY,
        "specimen_type": SpecimenType.WHOLE_BLOOD_EDTA,
        "tube_color": "Lavender / Purple Top (K2-EDTA)",
        "loinc_code": "32700-7",
        "price_etb": 60.0,
        "turnaround_time_mins": 25,
        "parameters": [
            {"name": "Thick Smear Parasite Density", "unit": "parasites/µL", "reference_range": "No parasites seen", "critical_high": 50000.0},
            {"name": "Thin Smear Species Identification", "unit": "", "reference_range": "Negative for Plasmodium"},
            {"name": "Parasite Stage Observed", "unit": "", "reference_range": "None"},
        ],
    },
    {
        "test_code": "FBS",
        "test_name": "Fasting Blood Sugar (FBS)",
        "name_om": "Sukkaara Dhiigaa (Soomaan)",
        "category": LabCategory.CLINICAL_CHEMISTRY,
        "specimen_type": SpecimenType.SERUM_SST,
        "tube_color": "Grey Top (Sodium Fluoride) / Gold SST",
        "loinc_code": "1558-6",
        "price_etb": 90.0,
        "turnaround_time_mins": 20,
        "parameters": [
            {"name": "Fasting Plasma Glucose", "unit": "mg/dL", "reference_range": "70 - 100", "min_ref": 70.0, "max_ref": 100.0, "critical_low": 50.0, "critical_high": 400.0},
        ],
    },
    {
        "test_code": "LFT_PANEL",
        "test_name": "Comprehensive Liver Function Tests (LFT)",
        "name_om": "Qorannoo Hojii Tiruu (LFT)",
        "category": LabCategory.CLINICAL_CHEMISTRY,
        "specimen_type": SpecimenType.SERUM_SST,
        "tube_color": "Gold / Red Top (Serum Separator SST)",
        "loinc_code": "24325-3",
        "price_etb": 320.0,
        "turnaround_time_mins": 45,
        "parameters": [
            {"name": "Alanine Aminotransferase (ALT / SGPT)", "unit": "U/L", "reference_range": "7 - 56", "min_ref": 7.0, "max_ref": 56.0, "critical_high": 500.0},
            {"name": "Aspartate Aminotransferase (AST / SGOT)", "unit": "U/L", "reference_range": "10 - 40", "min_ref": 10.0, "max_ref": 40.0, "critical_high": 500.0},
            {"name": "Alkaline Phosphatase (ALP)", "unit": "U/L", "reference_range": "44 - 147", "min_ref": 44.0, "max_ref": 147.0},
            {"name": "Total Bilirubin", "unit": "mg/dL", "reference_range": "0.1 - 1.2", "min_ref": 0.1, "max_ref": 1.2, "critical_high": 15.0},
            {"name": "Direct (Conjugated) Bilirubin", "unit": "mg/dL", "reference_range": "0.0 - 0.3", "min_ref": 0.0, "max_ref": 0.3},
            {"name": "Total Serum Protein", "unit": "g/dL", "reference_range": "6.0 - 8.3", "min_ref": 6.0, "max_ref": 8.3},
            {"name": "Serum Albumin", "unit": "g/dL", "reference_range": "3.5 - 5.0", "min_ref": 3.5, "max_ref": 5.0},
        ],
    },
    {
        "test_code": "RFT_PANEL",
        "test_name": "Renal Function Tests & Electrolytes (RFT)",
        "name_om": "Qorannoo Hojii Kalee (RFT)",
        "category": LabCategory.CLINICAL_CHEMISTRY,
        "specimen_type": SpecimenType.SERUM_SST,
        "tube_color": "Gold / Red Top (Serum Separator SST)",
        "loinc_code": "24362-6",
        "price_etb": 260.0,
        "turnaround_time_mins": 40,
        "parameters": [
            {"name": "Serum Creatinine", "unit": "mg/dL", "reference_range": "0.6 - 1.2", "min_ref": 0.6, "max_ref": 1.2, "critical_high": 5.0},
            {"name": "Blood Urea Nitrogen (BUN)", "unit": "mg/dL", "reference_range": "7 - 20", "min_ref": 7.0, "max_ref": 20.0, "critical_high": 80.0},
            {"name": "eGFR (Estimated Glomerular Filtration)", "unit": "mL/min/1.73m²", "reference_range": "> 90", "min_ref": 90.0, "critical_low": 15.0},
            {"name": "Serum Potassium (K+)", "unit": "mmol/L", "reference_range": "3.5 - 5.1", "min_ref": 3.5, "max_ref": 5.1, "critical_low": 2.8, "critical_high": 6.5},
            {"name": "Serum Sodium (Na+)", "unit": "mmol/L", "reference_range": "135 - 145", "min_ref": 135.0, "max_ref": 145.0, "critical_low": 120.0, "critical_high": 160.0},
        ],
    },
    {
        "test_code": "LIPID_PROFILE",
        "test_name": "Fasting Lipid Profile",
        "name_om": "Qorannoo Chooma Dhiigaa (Lipid)",
        "category": LabCategory.CLINICAL_CHEMISTRY,
        "specimen_type": SpecimenType.SERUM_SST,
        "tube_color": "Gold / Red Top (Serum Separator SST)",
        "loinc_code": "24331-1",
        "price_etb": 240.0,
        "turnaround_time_mins": 45,
        "parameters": [
            {"name": "Total Cholesterol", "unit": "mg/dL", "reference_range": "< 200", "max_ref": 200.0},
            {"name": "Triglycerides", "unit": "mg/dL", "reference_range": "< 150", "max_ref": 150.0, "critical_high": 500.0},
            {"name": "HDL Cholesterol (Good)", "unit": "mg/dL", "reference_range": "> 40", "min_ref": 40.0},
            {"name": "LDL Cholesterol (Calculated)", "unit": "mg/dL", "reference_range": "< 100", "max_ref": 100.0},
        ],
    },
    {
        "test_code": "URINALYSIS",
        "test_name": "Routine Urinalysis & Microscopic Exam",
        "name_om": "Qorannoo Fincaanii Waliigalaa",
        "category": LabCategory.PARASITOLOGY_URINALYSIS,
        "specimen_type": SpecimenType.URINE_CLEAN_CATCH,
        "tube_color": "Yellow Top / Sterile Urine Cup",
        "loinc_code": "24356-8",
        "price_etb": 75.0,
        "turnaround_time_mins": 25,
        "parameters": [
            {"name": "Physical Appearance / Color", "unit": "", "reference_range": "Clear / Pale Yellow"},
            {"name": "Urine Specific Gravity", "unit": "", "reference_range": "1.005 - 1.030", "min_ref": 1.005, "max_ref": 1.030},
            {"name": "pH", "unit": "", "reference_range": "5.0 - 7.5", "min_ref": 5.0, "max_ref": 7.5},
            {"name": "Protein / Albumin", "unit": "", "reference_range": "Negative"},
            {"name": "Glucose", "unit": "", "reference_range": "Negative"},
            {"name": "Ketones", "unit": "", "reference_range": "Negative"},
            {"name": "WBCs / Pus Cells", "unit": "/HPF", "reference_range": "0 - 5", "max_ref": 5.0},
            {"name": "RBCs", "unit": "/HPF", "reference_range": "0 - 2", "max_ref": 2.0},
            {"name": "Bacteria", "unit": "", "reference_range": "None seen"},
        ],
    },
    {
        "test_code": "STOOL_EXAM",
        "test_name": "Stool Direct Wet Mount & Concentration",
        "name_om": "Qorannoo Cawaa fi Maxxantootaa",
        "category": LabCategory.PARASITOLOGY_URINALYSIS,
        "specimen_type": SpecimenType.STOOL_CUP,
        "tube_color": "Sterile Stool Specimen Cup",
        "loinc_code": "10701-1",
        "price_etb": 65.0,
        "turnaround_time_mins": 25,
        "parameters": [
            {"name": "Consistency", "unit": "", "reference_range": "Formed / Soft"},
            {"name": "Ova & Parasites", "unit": "", "reference_range": "No ova or parasites seen"},
            {"name": "Pus Cells", "unit": "/HPF", "reference_range": "0 - 2"},
            {"name": "Occult Blood", "unit": "", "reference_range": "Negative"},
        ],
    },
    {
        "test_code": "WIDAL_TEST",
        "test_name": "Widal Slide Agglutination Test (S. Typhi O & H)",
        "name_om": "Qorannoo Dhibee Tifoyidii (Widal)",
        "category": LabCategory.SEROLOGY_IMMUNOLOGY,
        "specimen_type": SpecimenType.SERUM_SST,
        "tube_color": "Gold / Red Top (Serum Separator SST)",
        "loinc_code": "22497-2",
        "price_etb": 110.0,
        "turnaround_time_mins": 20,
        "parameters": [
            {"name": "Salmonella Typhi 'O' Antigen Titer", "unit": "Titer", "reference_range": "< 1:80 (Negative)"},
            {"name": "Salmonella Typhi 'H' Antigen Titer", "unit": "Titer", "reference_range": "< 1:80 (Negative)"},
        ],
    },
    {
        "test_code": "HIV_RAPID",
        "test_name": "HIV 1/2 Rapid Diagnostic Algorithm Screen",
        "name_om": "Qorannoo Vaayirasii HIV Saffisaa",
        "category": LabCategory.SEROLOGY_IMMUNOLOGY,
        "specimen_type": SpecimenType.WHOLE_BLOOD_EDTA,
        "tube_color": "Lavender Top / Fingerstick Whole Blood",
        "loinc_code": "75622-1",
        "price_etb": 0.0, # Government Free / MOH Program
        "turnaround_time_mins": 15,
        "parameters": [
            {"name": "Screening Test (Stat-Pak / Determine)", "unit": "", "reference_range": "Non-Reactive"},
        ],
    },
    {
        "test_code": "HBSAG_RAPID",
        "test_name": "Hepatitis B Surface Antigen (HBsAg) Rapid",
        "name_om": "Qorannoo Dhibee Tiruu Heppaataayitisii B",
        "category": LabCategory.SEROLOGY_IMMUNOLOGY,
        "specimen_type": SpecimenType.SERUM_SST,
        "tube_color": "Gold / Red Top (Serum Separator SST)",
        "loinc_code": "5196-1",
        "price_etb": 130.0,
        "turnaround_time_mins": 20,
        "parameters": [
            {"name": "Hepatitis B Surface Antigen", "unit": "", "reference_range": "Negative"},
        ],
    },
    {
        "test_code": "ABO_RH_TYPING",
        "test_name": "ABO Blood Grouping & Rh(D) Factor Confirmation",
        "name_om": "Gosa Dhiigaa fi Rh Adda Baasuu",
        "category": LabCategory.BLOOD_BANK,
        "specimen_type": SpecimenType.WHOLE_BLOOD_EDTA,
        "tube_color": "Pink / Lavender Top (EDTA Blood Bank)",
        "loinc_code": "883-9",
        "price_etb": 80.0,
        "turnaround_time_mins": 15,
        "parameters": [
            {"name": "ABO Blood Group", "unit": "", "reference_range": "A, B, AB, or O"},
            {"name": "Rh(D) Antigen Typing", "unit": "", "reference_range": "Positive (+) or Negative (-)"},
        ],
    },
]


async def seed_laboratory():
    print("🌱 Connecting to Database to Seed Laboratory (Module 4)...")
    async with engine.begin() as conn:
        print("🔨 Ensuring all tables are created...")
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Seed or Verify Patients
        pat1_res = await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000101"))
        pat1 = pat1_res.scalar_one_or_none()
        if not pat1:
            pat1 = Patient(
                mrn="MKH-2026-000101",
                first_name="Gudeta",
                last_name="Hailu",
                birth_date=date(1985, 4, 12),
                gender=Gender.MALE,
                phone_number="+251911223344",
                address_line="Kebele 01, Mettu Town",
            )
            session.add(pat1)
            await session.flush()

        pat2_res = await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000102"))
        pat2 = pat2_res.scalar_one_or_none()
        if not pat2:
            pat2 = Patient(
                mrn="MKH-2026-000102",
                first_name="Ayantu",
                last_name="Mamo",
                birth_date=date(1994, 9, 23),
                gender=Gender.FEMALE,
                phone_number="+251922334455",
                address_line="Kebele 03, Sor Woreda",
            )
            session.add(pat2)
            await session.flush()

        pat3_res = await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000103"))
        pat3 = pat3_res.scalar_one_or_none()
        if not pat3:
            pat3 = Patient(
                mrn="MKH-2026-000103",
                first_name="Chaltu",
                last_name="Abera",
                birth_date=date(1998, 1, 15),
                gender=Gender.FEMALE,
                phone_number="+251933445566",
                address_line="Kebele 02, Mettu Town",
            )
            session.add(pat3)
            await session.flush()

        pat4_res = await session.execute(select(Patient).where(Patient.mrn == "MKH-2026-000104"))
        pat4 = pat4_res.scalar_one_or_none()
        if not pat4:
            pat4 = Patient(
                mrn="MKH-2026-000104",
                first_name="Tolessa",
                last_name="Bekele",
                birth_date=date(1972, 11, 5),
                gender=Gender.MALE,
                phone_number="+251944556677",
                address_line="Kebele 04, Hurumu Woreda",
            )
            session.add(pat4)
            await session.flush()

        # 2. Seed Test Catalog
        catalog_map = {}
        for p in CLINICAL_PANELS:
            existing = await session.execute(select(LabTestCatalog).where(LabTestCatalog.test_code == p["test_code"]))
            record = existing.scalar_one_or_none()
            params_str = json.dumps(p["parameters"])
            if not record:
                record = LabTestCatalog(
                    test_code=p["test_code"],
                    test_name=p["test_name"],
                    name_om=p["name_om"],
                    category=p["category"],
                    specimen_type=p["specimen_type"],
                    tube_color=p["tube_color"],
                    loinc_code=p["loinc_code"],
                    price_etb=p["price_etb"],
                    turnaround_time_mins=p["turnaround_time_mins"],
                    parameters_json=params_str,
                    is_active=True,
                )
                session.add(record)
                await session.flush()
                print(f"  + Added Catalog Panel: {p['test_code']} ({p['test_name']})")
            else:
                record.parameters_json = params_str
                record.price_etb = p["price_etb"]
                record.tube_color = p["tube_color"]
            catalog_map[p["test_code"]] = record

        await session.commit()

        # 3. Seed Realistic Active Patient Lab Orders
        now = datetime.now(timezone.utc)

        # Order 1: STAT / EMERGENCY - Gudeta Hailu (Severe Malaria & Critical Anemia)
        ord1_res = await session.execute(select(LabOrder).where(LabOrder.order_number == "LAB-2026-000201"))
        ord1 = ord1_res.scalar_one_or_none()
        if not ord1:
            ord1 = LabOrder(
                order_number="LAB-2026-000201",
                patient_id=pat1.id,
                ordering_doctor_id=2, # Dr. Bekele
                priority=LabOrderPriority.STAT,
                clinical_notes="Acute febrile emergency, severe rigors, pallor, temp 39.8°C. Suspected severe malaria & profound anemia. STAT!",
                status=LabOrderStatus.COMPLETED,
                ordered_at=now - timedelta(hours=2),
                sample_collected_at=now - timedelta(hours=1, minutes=45),
                sample_collector_id=4, # Gemechu
                sample_barcode="SMP-2026-90412",
                completed_at=now - timedelta(minutes=40),
                verified_by_id=4, # Gemechu
                has_critical_flag=True,
            )
            session.add(ord1)
            await session.flush()

            # Items: CBC and Blood Film
            item1 = LabOrderItem(lab_order_id=ord1.id, test_catalog_id=catalog_map["CBC_DIFF"].id, status="completed")
            item2 = LabOrderItem(lab_order_id=ord1.id, test_catalog_id=catalog_map["BF_MALARIA"].id, status="completed")
            session.add_all([item1, item2])

            # Results
            r1 = LabResult(
                lab_order_id=ord1.id,
                test_catalog_id=catalog_map["CBC_DIFF"].id,
                parameter_name="Hemoglobin (Hgb)",
                result_value="6.4",
                unit="g/dL",
                reference_range="12.0 - 17.5",
                flag=ResultFlag.CRITICAL_PANIC,
                notes="CRITICAL LOW! Immediate whole blood/PRBC cross-match notified to attending physician.",
                technologist_id=4,
                recorded_at=now - timedelta(minutes=40),
            )
            r2 = LabResult(
                lab_order_id=ord1.id,
                test_catalog_id=catalog_map["CBC_DIFF"].id,
                parameter_name="White Blood Cell Count (WBC)",
                result_value="14.8",
                unit="x10³/µL",
                reference_range="4.0 - 11.0",
                flag=ResultFlag.HIGH,
                notes="Marked leukocytosis with neutrophilic shift",
                technologist_id=4,
                recorded_at=now - timedelta(minutes=40),
            )
            r3 = LabResult(
                lab_order_id=ord1.id,
                test_catalog_id=catalog_map["CBC_DIFF"].id,
                parameter_name="Platelet Count (PLT)",
                result_value="74",
                unit="x10³/µL",
                reference_range="150 - 450",
                flag=ResultFlag.LOW,
                notes="Thrombocytopenia secondary to malaria parasitemia",
                technologist_id=4,
                recorded_at=now - timedelta(minutes=40),
            )
            r4 = LabResult(
                lab_order_id=ord1.id,
                test_catalog_id=catalog_map["BF_MALARIA"].id,
                parameter_name="Thick Smear Parasite Density",
                result_value="142,000",
                unit="parasites/µL",
                reference_range="No parasites seen",
                flag=ResultFlag.CRITICAL_PANIC,
                notes="HIGH PARASITEMIA (+++)! P. falciparum trophozoites & schizonts present.",
                technologist_id=4,
                recorded_at=now - timedelta(minutes=40),
            )
            r5 = LabResult(
                lab_order_id=ord1.id,
                test_catalog_id=catalog_map["BF_MALARIA"].id,
                parameter_name="Thin Smear Species Identification",
                result_value="Plasmodium falciparum",
                unit="",
                reference_range="Negative for Plasmodium",
                flag=ResultFlag.HIGH,
                notes="Ring forms with double chromatin dots and banana-shaped gametocytes noted.",
                technologist_id=4,
                recorded_at=now - timedelta(minutes=40),
            )
            session.add_all([r1, r2, r3, r4, r5])
            print("  + Seeded STAT Malaria Order: LAB-2026-000201")

        # Order 2: URGENT - Ayantu Mamo (Diabetic Nephropathy Workup)
        ord2_res = await session.execute(select(LabOrder).where(LabOrder.order_number == "LAB-2026-000202"))
        ord2 = ord2_res.scalar_one_or_none()
        if not ord2:
            ord2 = LabOrder(
                order_number="LAB-2026-000202",
                patient_id=pat2.id,
                ordering_doctor_id=2,
                priority=LabOrderPriority.URGENT,
                clinical_notes="Type 2 Diabetes Mellitus with bilateral pedal edema and polyuria. Check glycemic control and renal impairment.",
                status=LabOrderStatus.SAMPLE_COLLECTED,
                ordered_at=now - timedelta(hours=1, minutes=15),
                sample_collected_at=now - timedelta(minutes=25),
                sample_collector_id=4,
                sample_barcode="SMP-2026-90413",
                completed_at=None,
                verified_by_id=None,
                has_critical_flag=False,
            )
            session.add(ord2)
            await session.flush()

            item1 = LabOrderItem(lab_order_id=ord2.id, test_catalog_id=catalog_map["FBS"].id, status="processing")
            item2 = LabOrderItem(lab_order_id=ord2.id, test_catalog_id=catalog_map["RFT_PANEL"].id, status="processing")
            item3 = LabOrderItem(lab_order_id=ord2.id, test_catalog_id=catalog_map["URINALYSIS"].id, status="processing")
            session.add_all([item1, item2, item3])
            print("  + Seeded URGENT In-Progress Order: LAB-2026-000202")

        # Order 3: ROUTINE - Chaltu Abera (Antenatal Booking Profile)
        ord3_res = await session.execute(select(LabOrder).where(LabOrder.order_number == "LAB-2026-000203"))
        ord3 = ord3_res.scalar_one_or_none()
        if not ord3:
            ord3 = LabOrder(
                order_number="LAB-2026-000203",
                patient_id=pat3.id,
                ordering_doctor_id=2,
                priority=LabOrderPriority.ROUTINE,
                clinical_notes="ANC 1st Trimester Booking (14 Weeks GA). Routine antenatal infectious and immunohematology panel.",
                status=LabOrderStatus.COMPLETED,
                ordered_at=now - timedelta(hours=3, minutes=30),
                sample_collected_at=now - timedelta(hours=3),
                sample_collector_id=4,
                sample_barcode="SMP-2026-90414",
                completed_at=now - timedelta(hours=2, minutes=10),
                verified_by_id=4,
                has_critical_flag=False,
            )
            session.add(ord3)
            await session.flush()

            item1 = LabOrderItem(lab_order_id=ord3.id, test_catalog_id=catalog_map["ABO_RH_TYPING"].id, status="completed")
            item2 = LabOrderItem(lab_order_id=ord3.id, test_catalog_id=catalog_map["HIV_RAPID"].id, status="completed")
            item3 = LabOrderItem(lab_order_id=ord3.id, test_catalog_id=catalog_map["HBSAG_RAPID"].id, status="completed")
            item4 = LabOrderItem(lab_order_id=ord3.id, test_catalog_id=catalog_map["URINALYSIS"].id, status="completed")
            session.add_all([item1, item2, item3, item4])

            # Results
            r1 = LabResult(
                lab_order_id=ord3.id,
                test_catalog_id=catalog_map["ABO_RH_TYPING"].id,
                parameter_name="ABO Blood Group",
                result_value="O",
                unit="",
                reference_range="A, B, AB, or O",
                flag=ResultFlag.NORMAL,
                technologist_id=4,
                recorded_at=now - timedelta(hours=2, minutes=10),
            )
            r2 = LabResult(
                lab_order_id=ord3.id,
                test_catalog_id=catalog_map["ABO_RH_TYPING"].id,
                parameter_name="Rh(D) Antigen Typing",
                result_value="Positive (+)",
                unit="",
                reference_range="Positive (+) or Negative (-)",
                flag=ResultFlag.NORMAL,
                technologist_id=4,
                recorded_at=now - timedelta(hours=2, minutes=10),
            )
            r3 = LabResult(
                lab_order_id=ord3.id,
                test_catalog_id=catalog_map["HIV_RAPID"].id,
                parameter_name="Screening Test (Stat-Pak / Determine)",
                result_value="Non-Reactive (Negative)",
                unit="",
                reference_range="Non-Reactive",
                flag=ResultFlag.NORMAL,
                technologist_id=4,
                recorded_at=now - timedelta(hours=2, minutes=10),
            )
            r4 = LabResult(
                lab_order_id=ord3.id,
                test_catalog_id=catalog_map["HBSAG_RAPID"].id,
                parameter_name="Hepatitis B Surface Antigen",
                result_value="Negative",
                unit="",
                reference_range="Negative",
                flag=ResultFlag.NORMAL,
                technologist_id=4,
                recorded_at=now - timedelta(hours=2, minutes=10),
            )
            session.add_all([r1, r2, r3, r4])
            print("  + Seeded ANC Routine Order: LAB-2026-000203")

        # Order 4: ROUTINE - Tolessa Bekele (Awaiting Sample Collection)
        ord4_res = await session.execute(select(LabOrder).where(LabOrder.order_number == "LAB-2026-000204"))
        ord4 = ord4_res.scalar_one_or_none()
        if not ord4:
            ord4 = LabOrder(
                order_number="LAB-2026-000204",
                patient_id=pat4.id,
                ordering_doctor_id=2,
                priority=LabOrderPriority.ROUTINE,
                clinical_notes="Chronic Hepatitis B follow-up. Monitor hepatic enzymes and transaminases.",
                status=LabOrderStatus.ORDERED,
                ordered_at=now - timedelta(minutes=18),
                sample_collected_at=None,
                sample_collector_id=None,
                sample_barcode=None,
                completed_at=None,
                verified_by_id=None,
                has_critical_flag=False,
            )
            session.add(ord4)
            await session.flush()

            item1 = LabOrderItem(lab_order_id=ord4.id, test_catalog_id=catalog_map["LFT_PANEL"].id, status="ordered")
            session.add(item1)
            print("  + Seeded Awaiting Phlebotomy Order: LAB-2026-000204")

        await session.commit()
        print("✅ Laboratory Seeding Completed Successfully!")


if __name__ == "__main__":
    asyncio.run(seed_laboratory())
