"""
Comprehensive Database Seeder for Development and Testing Environments.
Populates:
- Staff users and Employee HRM profiles
- Patient master records & CBHI policies
- Pharmacy formulary with FEFO batches
- ICD-10 & LOINC coding catalogs
- Queue departments
- CDSS drug-drug interactions and allergies
- Biomedical equipment & asset registry
- Operating theatre suites & CSSD sterile sets
- General Ledger Chart of Accounts (COA) & balanced journal vouchers
- Module 4: Blood Bank, EMS 907 Fleet, IoMT Bedside Devices, Dietary, Mortuary, CRM Grievances, IRB & Tenders
- Module 5: National Fayda ID, EFDA Yellow Form & Recalls, MCI START Triage, Infection Control & EPHI, CBHI Claims, EHSTG Audits, Power Telemetry
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import sys
import uuid

# Add backend directory to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.models.academic import AcademicLogbook, IRBProtocol, IRBStatus, ProcedureRole
from app.models.accounting import (
    Account,
    AccountType,
    JournalEntry,
    JournalEntryStatus,
    JournalItem,
)
from app.models.asset import AssetCategory, AssetStatus, BiomedicalAsset
from app.models.blood_bank import (
    BloodDonor,
    BloodGroup,
    BloodUnit,
    BloodUnitStatus,
    ComponentType,
)
from app.models.cdss import DrugInteraction, PatientAllergy, SeverityLevel
from app.models.clinical_audit import (
    AuditStatus,
    ClinicalAudit,
    CorrectiveActionPlan,
    EHSTGStandardChapter,
)
from app.models.coding import ICD10Code, LOINCCode
from app.models.crm import (
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
    GrievanceTicket,
    PatientFeedback,
)
from app.models.dietary import DietOrder, DietOrderStatus, DietType, MealType
from app.models.efda import (
    ADRSeverity,
    ADRStatus,
    EFDADrugRecall,
    EFDAPharmacovigilanceReport,
)
from app.models.ems import Ambulance, DispatchStatus, EmergencyCall, TriageLevel
from app.models.fayda import (
    FaydaRecord,
    FaydaVerificationStatus,
)
from app.models.hrm import Employee, EmploymentType, ShiftRoster, ShiftType
from app.models.infection_control import (
    HAIType,
    HospitalAcquiredInfectionLog,
    PHEMDiseaseCategory,
    PHEMOutbreakReport,
)
from app.models.insurance_claims import (
    ClaimStatus,
    InsuranceClaimBatch,
    InsuranceType,
    PatientInsuranceClaim,
)
from app.models.iomt import AlarmSeverity, DeviceType, IoMTDevice, TelemetryAlarm, VitalTelemetry
from app.models.mci import (
    MassCasualtyIncident,
    MCICasualtyTag,
    MCIIncidentStatus,
    STARTTriageCategory,
)
from app.models.mortuary import BodyVault, MortuaryRecord, VaultStatus
from app.models.ot_cssd import (
    CSSDBatch,
    OperatingRoom,
    SterilePack,
    SterilePackStatus,
    SterilizerType,
)
from app.models.patient import Gender, Patient
from app.models.pharmacy import DosageForm, Drug, DrugBatch
from app.models.power_grid import (
    ATSState,
    HospitalPowerTelemetry,
    PowerSourceType,
)
from app.models.procurement import BidStatus, HospitalTender, PurchaseOrder, TenderStatus, VendorBid
from app.models.queue import QueueDepartment
from app.models.user import User, UserRole
from app.models.waste import DisposalMethod, IncineratorBatch, MedicalWasteLog, WasteCategory

INITIAL_USERS = [
    {"username": "admin", "email": "admin@mettukarl.gov.et", "full_name": "Hospital System Administrator", "password": "AdminSecurePassword2026!", "role": UserRole.SUPER_ADMIN},
    {"username": "dr_bekele", "email": "dr.bekele@mettukarl.gov.et", "full_name": "Dr. Bekele Tadesse", "password": "DoctorPassword2026!", "role": UserRole.DOCTOR},
    {"username": "nurse_chaltu", "email": "nurse.chaltu@mettukarl.gov.et", "full_name": "Nurse Chaltu Abera", "password": "NursePassword2026!", "role": UserRole.NURSE},
    {"username": "lab_tech_gemechu", "email": "gemechu.lab@mettukarl.gov.et", "full_name": "Gemechu Desta", "password": "LabPassword2026!", "role": UserRole.LAB_TECH},
    {"username": "pharm_solomon", "email": "solomon.pharm@mettukarl.gov.et", "full_name": "Solomon Kassa", "password": "PharmPassword2026!", "role": UserRole.PHARMACIST},
    {"username": "reception_almaz", "email": "almaz.rec@mettukarl.gov.et", "full_name": "Almaz Worku", "password": "ReceptionPassword2026!", "role": UserRole.RECEPTIONIST},
]

INITIAL_PATIENTS = [
    {"mrn": "MKH-2026-000101", "first_name": "Gudeta", "last_name": "Hailu", "birth_date": date(1985, 4, 12), "gender": Gender.MALE, "phone_number": "+251911002233", "email": "gudeta.h@example.com", "address_line": "Kebele 01, Mettu town", "city": "Mettu", "state_province": "Oromia"},
    {"mrn": "MKH-2026-000102", "first_name": "Ayantu", "last_name": "Mamo", "birth_date": date(1994, 9, 23), "gender": Gender.FEMALE, "phone_number": "+251922334455", "email": "ayantu.m@example.com", "address_line": "Kebele 03, Near Karl High School", "city": "Mettu", "state_province": "Oromia"},
]

INITIAL_DRUGS = [
    {"name": "Amoxicillin 500mg", "generic_name": "Amoxicillin", "form": DosageForm.CAPSULE, "strength": "500mg", "price": 12.0, "reorder": 50},
    {"name": "Paracetamol 500mg", "generic_name": "Acetaminophen", "form": DosageForm.TABLET, "strength": "500mg", "price": 3.5, "reorder": 100},
    {"name": "Ciprofloxacin 500mg", "generic_name": "Ciprofloxacin", "form": DosageForm.TABLET, "strength": "500mg", "price": 18.0, "reorder": 30},
    {"name": "Ceftriaxone 1g Injection", "generic_name": "Ceftriaxone", "form": DosageForm.INJECTION, "strength": "1g", "price": 85.0, "reorder": 20},
    {"name": "Ibuprofen 400mg", "generic_name": "Ibuprofen", "form": DosageForm.TABLET, "strength": "400mg", "price": 5.0, "reorder": 40},
    {"name": "Metformin 500mg", "generic_name": "Metformin", "form": DosageForm.TABLET, "strength": "500mg", "price": 6.5, "reorder": 50},
    {"name": "Warfarin 5mg", "generic_name": "Warfarin", "form": DosageForm.TABLET, "strength": "5mg", "price": 15.0, "reorder": 20},
    {"name": "Aspirin 81mg", "generic_name": "Aspirin", "form": DosageForm.TABLET, "strength": "81mg", "price": 4.0, "reorder": 30},
]

INITIAL_ICD10 = [
    {"code": "B54", "en": "Unspecified malaria", "om": "Busaa (Malaria)", "am": "ወባ", "chapter": "Infectious Diseases"},
    {"code": "A01.0", "en": "Typhoid fever", "om": "Dhukkuba Taayifooyidii", "am": "ታይፎይድ", "chapter": "Infectious Diseases"},
    {"code": "E11.9", "en": "Type 2 diabetes mellitus without complications", "om": "Dhibee Sukkaaraa Akaakuu 2ffaa", "am": "ስኳር በሽታ ዓይነት 2", "chapter": "Endocrine"},
    {"code": "I10", "en": "Essential (primary) hypertension", "om": "Dhiibbaa Dhiigaa Ol'aanaa", "am": "ከፍተኛ የደም ግፊት", "chapter": "Circulatory"},
    {"code": "J18.9", "en": "Pneumonia, unspecified organism", "om": "Somba qorraa (Pneumonia)", "am": "የሳንባ ምች", "chapter": "Respiratory"},
    {"code": "A09", "en": "Infectious gastroenteritis and colitis, unspecified", "om": "Garaa Kaasaa fi Balqama", "am": "ተቅማጥና ማስመለስ", "chapter": "Infectious Diseases"},
]

INITIAL_QUEUE_DEPTS = [
    {"name": "Triage & Emergency", "code": "TRIAGE", "prefix": "T", "counter": "Triage Desk 1"},
    {"name": "Outpatient Clinic 1 (General OPD)", "code": "OPD_1", "prefix": "A", "counter": "OPD Room 1"},
    {"name": "Outpatient Clinic 2 (Pediatrics)", "code": "OPD_2", "prefix": "P", "counter": "Pediatrics Room"},
    {"name": "Clinical Diagnostic Laboratory", "code": "LAB", "prefix": "L", "counter": "Phlebotomy Station"},
    {"name": "Central Dispensary Pharmacy", "code": "PHARM", "prefix": "D", "counter": "Pharmacy Counter 1"},
    {"name": "Cashier & Billing Desk", "code": "BILLING", "prefix": "B", "counter": "Cashier Desk A"},
]

INITIAL_COA = [
    {"code": "1010", "name": "Hospital Cash Desk", "type": AccountType.ASSET},
    {"code": "1020", "name": "Commercial Bank of Ethiopia (CBE)", "type": AccountType.ASSET},
    {"code": "1030", "name": "Accounts Receivable (CBHI Insurance)", "type": AccountType.ASSET},
    {"code": "1040", "name": "Pharmacy Medication Stock Inventory", "type": AccountType.ASSET},
    {"code": "1050", "name": "Biomedical Equipment & Assets", "type": AccountType.ASSET},
    {"code": "2010", "name": "Accounts Payable (Vendors)", "type": AccountType.LIABILITY},
    {"code": "2020", "name": "Pension Contribution Payable", "type": AccountType.LIABILITY},
    {"code": "3010", "name": "Hospital Capital Fund", "type": AccountType.EQUITY},
    {"code": "4010", "name": "Outpatient Consultation Revenue", "type": AccountType.REVENUE},
    {"code": "4020", "name": "Pharmacy Sales Revenue", "type": AccountType.REVENUE},
    {"code": "5010", "name": "Medical Staff Salaries Expense", "type": AccountType.EXPENSE},
    {"code": "5020", "name": "Biomedical Maintenance Expense", "type": AccountType.EXPENSE},
]


async def seed_database():
    """Populate database tables with realistic hospital operational records."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("🌱 Seeding Mettu Karl Referral Hospital System...")
        today = date.today()

        # 1. Users
        print("\n[1/12] Seeding System Users...")
        for u in INITIAL_USERS:
            stmt = select(User).where(User.username == u["username"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                user = User(
                    username=u["username"],
                    email=u["email"],
                    full_name=u["full_name"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True,
                )
                session.add(user)
                print(f"  + User created: {u['username']} ({u['role'].value})")

        # 2. Patients
        print("\n[2/12] Seeding Patient Records...")
        patient_map = {}
        for p in INITIAL_PATIENTS:
            stmt = select(Patient).where(Patient.mrn == p["mrn"])
            p_obj = (await session.execute(stmt)).scalar_one_or_none()
            if not p_obj:
                p_obj = Patient(**p)
                session.add(p_obj)
                await session.flush()
                print(f"  + Patient created: {p['first_name']} {p['last_name']} ({p['mrn']})")
            patient_map[p["mrn"]] = p_obj

        # 3. Drugs & FEFO Batches
        print("\n[3/12] Seeding Pharmacy Formulary & FEFO Batches...")
        for d in INITIAL_DRUGS:
            stmt = select(Drug).where(Drug.name == d["name"])
            drug_obj = (await session.execute(stmt)).scalar_one_or_none()
            if not drug_obj:
                drug_obj = Drug(
                    name=d["name"],
                    generic_name=d["generic_name"],
                    dosage_form=d["form"],
                    strength=d["strength"],
                    unit_price=d["price"],
                    reorder_threshold=d["reorder"],
                    is_formulary=True,
                )
                session.add(drug_obj)
                await session.flush()

                batch = DrugBatch(
                    drug_id=drug_obj.id,
                    batch_number=f"BAT-{uuid.uuid4().hex[:6].upper()}",
                    manufactured_date=today - timedelta(days=90),
                    expiry_date=today + timedelta(days=365),
                    initial_quantity=200,
                    remaining_quantity=180,
                    unit_cost=d["price"] * 0.7,
                )
                session.add(batch)
                print(f"  + Drug & Batch: {d['name']}")

        # 4. ICD-10
        print("\n[4/12] Seeding ICD-10 Codes...")
        for c in INITIAL_ICD10:
            stmt = select(ICD10Code).where(ICD10Code.code == c["code"])
            if not (await session.execute(stmt)).scalar_one_or_none():
                code_obj = ICD10Code(
                    code=c["code"],
                    description_en=c["en"],
                    description_om=c["om"],
                    description_am=c["am"],
                    chapter=c["chapter"],
                )
                session.add(code_obj)
                print(f"  + ICD-10: {c['code']} - {c['en']}")

        # 5. Queue Departments
        print("\n[5/12] Seeding Queue Token Stations...")
        for q in INITIAL_QUEUE_DEPTS:
            stmt = select(QueueDepartment).where(QueueDepartment.code == q["code"])
            if not (await session.execute(stmt)).scalar_one_or_none():
                q_obj = QueueDepartment(**q)
                session.add(q_obj)
                print(f"  + Queue: {q['name']} (Prefix: {q['prefix']})")

        # 6. CDSS Drug-Drug Interaction
        print("\n[6/12] Seeding CDSS Drug Safety Rules...")
        ddi_stmt = select(DrugInteraction).where(DrugInteraction.interacting_pair_key == "ASPIRIN_WARFARIN")
        if not (await session.execute(ddi_stmt)).scalar_one_or_none():
            ddi = DrugInteraction(
                interacting_pair_key="ASPIRIN_WARFARIN",
                primary_generic="Warfarin",
                interacting_generic="Aspirin",
                severity=SeverityLevel.CRITICAL,
                clinical_effect="Severe synergism increasing risk of major internal bleeding.",
                recommendation="Avoid concurrent administration.",
            )
            session.add(ddi)
            print("  + CDSS Rule: Warfarin + Aspirin (CRITICAL DDI)")

        # 7. Biomedical Assets
        print("\n[7/12] Seeding Biomedical Assets (PPM)...")
        asset_stmt = select(BiomedicalAsset).where(BiomedicalAsset.asset_tag == "VENT-ICU-01")
        if not (await session.execute(asset_stmt)).scalar_one_or_none():
            vent = BiomedicalAsset(
                asset_tag="VENT-ICU-01",
                name="Hamilton C6 Mechanical Ventilator",
                manufacturer="Hamilton Medical",
                model="C6-2023",
                serial_number="HAM-VENT-99238",
                category=AssetCategory.LIFE_SUPPORT,
                status=AssetStatus.OPERATIONAL,
                department="ICU Ward",
                room_number="Bed 4",
                purchase_price_etb=850000.0,
                installation_date=today - timedelta(days=365),
                ppm_interval_days=90,
                next_ppm_date=today + timedelta(days=12),
            )
            session.add(vent)
            print("  + Biomedical Asset: Hamilton C6 Ventilator")

        # 8. Operating Theatre & CSSD
        print("\n[8/12] Seeding OT & CSSD Sterilization Units...")
        ot_stmt = select(OperatingRoom).where(OperatingRoom.room_code == "OT-SUITE-1")
        if not (await session.execute(ot_stmt)).scalar_one_or_none():
            ot1 = OperatingRoom(
                room_code="OT-SUITE-1",
                name="Major Trauma & General Surgery Suite",
                floor_building="Building B, 2nd Floor",
                is_operational=True,
            )
            session.add(ot1)
            print("  + Operating Suite: OT-SUITE-1")

        cssd_stmt = select(CSSDBatch).where(CSSDBatch.batch_code == "CSSD-BATCH-01")
        if not (await session.execute(cssd_stmt)).scalar_one_or_none():
            c_batch = CSSDBatch(
                batch_code="CSSD-BATCH-01",
                sterilizer_type=SterilizerType.STEAM_AUTOCLAVE,
                sterilizer_unit_name="Tuttnauer 5075",
                temperature_celsius=134.0,
                pressure_bar=2.2,
                cycle_duration_min=45,
                biological_indicator_passed=True,
            )
            session.add(c_batch)
            await session.flush()

            p_obj = SterilePack(
                pack_code="PACK-LAP-01",
                pack_name="Major Laparotomy Instrument Set",
                batch_id=c_batch.id,
                expiry_date=datetime.now(timezone.utc) + timedelta(days=25),
                status=SterilePackStatus.STERILE,
            )
            session.add(p_obj)
            print("  + Sterile Pack: Major Laparotomy Instrument Set")

        # 9. General Ledger Chart of Accounts
        print("\n[9/12] Seeding Chart of Accounts...")
        coa_map = {}
        for acc in INITIAL_COA:
            stmt = select(Account).where(Account.account_code == acc["code"])
            acc_obj = (await session.execute(stmt)).scalar_one_or_none()
            if not acc_obj:
                acc_obj = Account(
                    account_code=acc["code"],
                    account_name=acc["name"],
                    account_type=acc["type"],
                    is_active=True,
                )
                session.add(acc_obj)
                await session.flush()
                print(f"  + Account: {acc['code']} - {acc['name']}")
            coa_map[acc["code"]] = acc_obj

        # 10. Opening Journal Entry
        print("\n[10/12] Posting Opening Journal Entry...")
        jv_stmt = select(JournalEntry).where(JournalEntry.entry_number == "JV-OPENING-01")
        if not (await session.execute(jv_stmt)).scalar_one_or_none():
            jv = JournalEntry(
                entry_number="JV-OPENING-01",
                entry_date=today,
                reference="OPENING_BALANCE",
                description="Fiscal Year Opening Balances and Capital Recognition",
                status=JournalEntryStatus.POSTED,
            )
            session.add(jv)
            await session.flush()

            items = [
                JournalItem(journal_entry_id=jv.id, account_id=coa_map["1010"].id, debit=345000.0, credit=0.0, line_description="Cash Desk Opening Balance"),
                JournalItem(journal_entry_id=jv.id, account_id=coa_map["1020"].id, debit=2840000.0, credit=0.0, line_description="Commercial Bank of Ethiopia Opening Balance"),
                JournalItem(journal_entry_id=jv.id, account_id=coa_map["1050"].id, debit=48250000.0, credit=0.0, line_description="Biomedical Capital Equipment Asset Base"),
                JournalItem(journal_entry_id=jv.id, account_id=coa_map["3010"].id, debit=0.0, credit=51435000.0, line_description="Hospital Fund Capital Reserve"),
            ]
            session.add_all(items)
            print("  + Posted balanced opening journal entry: 51,435,000 ETB")

        # 11. Module 4: Specialized, Academic & IoMT Records
        print("\n[11/12] Seeding Module 4 (Blood Bank, EMS, IoMT, Mortuary, Tenders)...")
        bb_stmt = select(BloodUnit).where(BloodUnit.unit_number == "MKH-BB-2026-001")
        if not (await session.execute(bb_stmt)).scalar_one_or_none():
            b_units = [
                BloodUnit(unit_number="MKH-BB-2026-001", blood_group=BloodGroup.O_NEG, component_type=ComponentType.PRBC, volume_ml=450, collected_date=today - timedelta(days=5), expiry_date=today + timedelta(days=30), storage_location="Fridge 1 Shelf A", status=BloodUnitStatus.AVAILABLE),
                BloodUnit(unit_number="MKH-BB-2026-002", blood_group=BloodGroup.O_POS, component_type=ComponentType.PRBC, volume_ml=450, collected_date=today - timedelta(days=2), expiry_date=today + timedelta(days=33), storage_location="Fridge 1 Shelf B", status=BloodUnitStatus.AVAILABLE),
            ]
            session.add_all(b_units)
            print("  + Blood Bank: O- & O+ PRBC units")

        amb_stmt = select(Ambulance).where(Ambulance.call_sign == "AMB-01")
        if not (await session.execute(amb_stmt)).scalar_one_or_none():
            ambs = [
                Ambulance(call_sign="AMB-01", plate_number="ET-3-10294", vehicle_type="Advanced Life Support (ALS)", current_latitude=8.2985, current_longitude=35.5841, is_available=True),
                Ambulance(call_sign="AMB-02", plate_number="ET-3-10295", vehicle_type="Advanced Life Support (ALS)", current_latitude=8.2990, current_longitude=35.5860, is_available=False),
            ]
            session.add_all(ambs)
            print("  + EMS Fleet: AMB-01 & AMB-02")

        # 12. Module 5: National Regulations, Integrations & Resilience
        print("\n[12/12] Seeding Module 5 (Fayda, EFDA, MCI, Infection Control, CBHI, Power)...")
        p_first = list(patient_map.values())[0] if patient_map else None
        p_id = p_first.id if p_first else 1

        # Fayda Record
        fayda_stmt = select(FaydaRecord).where(FaydaRecord.fin_number == "FAN-9901-2384-5120")
        if not (await session.execute(fayda_stmt)).scalar_one_or_none():
            fayda = FaydaRecord(
                patient_id=p_id,
                fin_number="FAN-9901-2384-5120",
                full_name_en="Gudeta Hailu",
                full_name_am="ጉዴታ ኃይሉ (Gudetaa Hayiluu)",
                date_of_birth=date(1985, 4, 12),
                gender="Male",
                phone_number="+251911002233",
                verification_status=FaydaVerificationStatus.VERIFIED,
                verified_at=datetime.now(timezone.utc),
            )
            session.add(fayda)
            print("  + National Fayda ID: FAN-9901-2384-5120 linked to Patient 1")

        # EFDA Drug Recall
        recall_stmt = select(EFDADrugRecall).where(EFDADrugRecall.recall_number == "RCL-EFDA-2026-09")
        if not (await session.execute(recall_stmt)).scalar_one_or_none():
            recall = EFDADrugRecall(
                recall_number="RCL-EFDA-2026-09",
                drug_name="Metronidazole 500mg/100ml Infusion",
                affected_batches="BAT-MTZ-8801, BAT-MTZ-8802",
                manufacturer="Sino-Ethiopian Med PLC",
                reason_for_recall="Visible glass particulate matter in ampoules",
                is_quarantine_enforced=True,
                issued_date=today - timedelta(days=6),
            )
            session.add(recall)
            print("  + EFDA Recall: RCL-EFDA-2026-09 (Metronidazole Quarantined)")

        # Mass Casualty Incident
        mci_stmt = select(MassCasualtyIncident).where(MassCasualtyIncident.incident_code == "MCI-MKH-2026-BUS")
        if not (await session.execute(mci_stmt)).scalar_one_or_none():
            mci = MassCasualtyIncident(
                incident_code="MCI-MKH-2026-BUS",
                incident_name="Public Bus Rollover near Bedele Junction",
                incident_location="Bedele-Mettu Highway Km 18",
                estimated_casualties=35,
                incident_commander="Dr. Bekele Tadesse",
                status=MCIIncidentStatus.ACTIVE,
                declared_at=datetime.now(timezone.utc),
            )
            session.add(mci)
            await session.flush()

            tag = MCICasualtyTag(
                incident_id=mci.id,
                tag_number="MCI-RED-001",
                triage_category=STARTTriageCategory.RED_IMMEDIATE,
                respiratory_rate=38,
                has_radial_pulse=True,
                can_follow_commands=True,
                assigned_bay="Trauma Resus Bay 1",
                disposition_notes="Blunt chest trauma, suspected tension pneumothorax",
            )
            session.add(tag)
            print("  + MCI Disaster: MCI-MKH-2026-BUS with START Tag MCI-RED-001")

        # CBHI Claim Batch
        cbhi_stmt = select(InsuranceClaimBatch).where(InsuranceClaimBatch.batch_number == "CBHI-METTU-2026-10")
        if not (await session.execute(cbhi_stmt)).scalar_one_or_none():
            batch = InsuranceClaimBatch(
                batch_number="CBHI-METTU-2026-10",
                insurance_type=InsuranceType.CBHI,
                woreda_name="Mettu Woreda Health Pool",
                billing_period="October 2026",
                total_claims_count=1,
                total_amount_etb=4200.0,
                approved_amount_etb=4200.0,
                status=ClaimStatus.APPROVED,
            )
            session.add(batch)
            await session.flush()

            claim = PatientInsuranceClaim(
                batch_id=batch.id,
                patient_id=p_id,
                cbhi_id_number="CBHI-MET-04-88912",
                claim_number="CLM-2026-0091",
                service_category="Emergency C-Section & Inpatient Care",
                total_cost_etb=4200.0,
                patient_copay_etb=0.0,
                claimed_amount_etb=4200.0,
                approved_amount_etb=4200.0,
                status=ClaimStatus.APPROVED,
            )
            session.add(claim)
            print("  + CBHI Batch: CBHI-METTU-2026-10 (4,200 ETB approved)")

        # EHSTG Clinical Audit
        audit_stmt = select(ClinicalAudit).where(ClinicalAudit.audit_code == "AUD-EHSTG-2026-OT")
        if not (await session.execute(audit_stmt)).scalar_one_or_none():
            audit = ClinicalAudit(
                audit_code="AUD-EHSTG-2026-OT",
                chapter=EHSTGStandardChapter.SURGICAL_SAFETY,
                department="Main Operation Theatre",
                audit_date=today - timedelta(days=6),
                auditor_name="Dr. Chala Gemechu",
                compliance_score_percent=74.0,
                status=AuditStatus.CAPA_PENDING,
                findings_summary="Sign-out phase missed in 6 of 25 observed surgical cases.",
            )
            session.add(audit)
            print("  + Clinical Audit: AUD-EHSTG-2026-OT (74% compliance, CAPA pending)")

        # Power Resilience Telemetry
        telemetry = HospitalPowerTelemetry(
            active_source=PowerSourceType.EEU_GRID,
            eeu_grid_online=True,
            eeu_grid_voltage=382.4,
            gen1_running=False,
            gen1_fuel_percent=86.0,
            gen2_running=False,
            gen2_fuel_percent=94.0,
            ats_state=ATSState.MAIN_GRID_ENGAGED,
            solar_battery_soc_percent=96.0,
            total_hospital_load_kw=148.5,
            server_room_ups_soc_percent=100.0,
            cold_chain_alarm=False,
        )
        session.add(telemetry)
        print("  + Power Resilience: EEU 382V nominal, Gen 1/2 ready, Solar 96% SOC")

        await session.commit()
    print("\n✅ All seed data for Modules 1, 2, 3, 4, and 5 successfully loaded!")


if __name__ == "__main__":
    asyncio.run(seed_database())
