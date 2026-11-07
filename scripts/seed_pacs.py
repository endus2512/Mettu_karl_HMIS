"""
PACS & Radiology Database Table Seeder.
Creates realistic radiology orders and DICOM studies with image projections,
window/level presets, and radiologist narrative impressions.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, Base, engine
from app.models.pacs import (
    DICOMStudy,
    ModalityType,
    RadiologyOrder,
    RadiologyStatus,
)
from app.models.patient import Gender, Patient


# Realistic medical imaging SVG data representations for the web viewer canvas
CHEST_XRAY_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <rect width="500" height="500" fill="#05070a"/>
  <!-- Spine and vertebrae -->
  <rect x="242" y="70" width="16" height="340" rx="4" fill="#64748b" opacity="0.65"/>
  <!-- Ribcage left -->
  <path d="M 240 120 Q 150 140 110 180 Q 90 220 120 250" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <path d="M 240 160 Q 140 180 95 230 Q 80 270 125 300" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <path d="M 240 200 Q 130 220 90 280 Q 75 320 130 350" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <path d="M 240 240 Q 130 260 90 320 Q 80 360 140 390" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <!-- Ribcage right -->
  <path d="M 260 120 Q 350 140 390 180 Q 410 220 380 250" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <path d="M 260 160 Q 360 180 405 230 Q 420 270 375 300" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <path d="M 260 200 Q 370 220 410 280 Q 425 320 370 350" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <path d="M 260 240 Q 370 260 410 320 Q 420 360 360 390" fill="none" stroke="#94a3b8" stroke-width="8" opacity="0.6"/>
  <!-- Clavicles -->
  <path d="M 240 110 Q 160 100 90 120" fill="none" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
  <path d="M 260 110 Q 340 100 410 120" fill="none" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
  <!-- Lung Fields (radiolucent / dark) -->
  <ellipse cx="170" cy="250" rx="65" ry="110" fill="#0f172a" opacity="0.75"/>
  <ellipse cx="330" cy="250" rx="65" ry="110" fill="#0f172a" opacity="0.75"/>
  <!-- Lower lobe consolidation infiltrate (Pneumonia) -->
  <ellipse cx="185" cy="310" rx="35" ry="25" fill="#94a3b8" opacity="0.45" filter="blur(4px)"/>
  <ellipse cx="315" cy="320" rx="30" ry="20" fill="#94a3b8" opacity="0.4" filter="blur(4px)"/>
  <!-- Cardiac Silhouette -->
  <path d="M 220 220 Q 180 260 200 330 Q 240 370 280 340 Q 270 250 250 220 Z" fill="#475569" opacity="0.7"/>
  <!-- Diaphragm domes -->
  <path d="M 80 400 Q 170 350 240 370" fill="none" stroke="#cbd5e1" stroke-width="6" opacity="0.75"/>
  <path d="M 260 370 Q 330 350 420 400" fill="none" stroke="#cbd5e1" stroke-width="6" opacity="0.75"/>
  <!-- HUD Text -->
  <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">MKH RADIOLOGY • CHEST PA ERECT</text>
  <text x="30" y="470" fill="#94a3b8" font-family="monospace" font-size="11">R • 120 kVp • 200 mAs</text>
  <text x="380" y="470" fill="#38bdf8" font-family="monospace" font-size="11">LAT: 0° • ROT: 0°</text>
</svg>"""

HEAD_CT_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <rect width="500" height="500" fill="#05070a"/>
  <!-- Calvarium / Skull Bone -->
  <ellipse cx="250" cy="250" rx="160" ry="190" fill="#090d16" stroke="#f1f5f9" stroke-width="14" opacity="0.9"/>
  <!-- Brain Parenchyma -->
  <ellipse cx="250" cy="250" rx="146" ry="176" fill="#1e293b" opacity="0.85"/>
  <!-- Interhemispheric fissure -->
  <line x1="250" y1="80" x2="250" y2="420" stroke="#0f172a" stroke-width="4" opacity="0.9"/>
  <!-- Lateral Ventricles (CSF) -->
  <path d="M 235 210 Q 220 240 235 270 Q 242 250 242 225 Z" fill="#090d16" stroke="#334155" stroke-width="2"/>
  <path d="M 265 210 Q 280 240 265 270 Q 258 250 258 225 Z" fill="#090d16" stroke="#334155" stroke-width="2"/>
  <!-- Sulci and Gyri -->
  <path d="M 150 170 Q 180 190 160 220" fill="none" stroke="#0f172a" stroke-width="3"/>
  <path d="M 350 170 Q 320 190 340 220" fill="none" stroke="#0f172a" stroke-width="3"/>
  <path d="M 140 280 Q 180 290 150 330" fill="none" stroke="#0f172a" stroke-width="3"/>
  <path d="M 360 280 Q 320 290 350 330" fill="none" stroke="#0f172a" stroke-width="3"/>
  <!-- Normal calvarium intact -->
  <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">MKH 64-SLICE CT • BRAIN NON-CONTRAST</text>
  <text x="30" y="470" fill="#94a3b8" font-family="monospace" font-size="11">WW: 80 • WL: 40 • SLICE: 64/128</text>
  <text x="380" y="470" fill="#38bdf8" font-family="monospace" font-size="11">AXIAL 5.0mm</text>
</svg>"""

OB_US_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <rect width="500" height="500" fill="#05070a"/>
  <!-- Ultrasound Pie Sector Fan Beam -->
  <path d="M 250 40 L 40 450 A 320 320 0 0 0 460 450 Z" fill="#0f172a" opacity="0.6"/>
  <!-- Acoustic speckle textures -->
  <ellipse cx="250" cy="270" rx="140" ry="110" fill="#1e293b" opacity="0.6"/>
  <!-- Gestational Sac / Amniotic Fluid (Anechoic / Black) -->
  <ellipse cx="250" cy="270" rx="100" ry="80" fill="#030712"/>
  <!-- Fetal Skull / BPD Measurement Ring -->
  <ellipse cx="230" cy="250" rx="45" ry="35" fill="#1e293b" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="3,3"/>
  <!-- Fetal Spine -->
  <path d="M 270 260 Q 300 290 280 320" fill="none" stroke="#f8fafc" stroke-width="4"/>
  <!-- Caliper Markers -->
  <circle cx="185" cy="250" r="4" fill="#38bdf8"/>
  <circle cx="275" cy="250" r="4" fill="#38bdf8"/>
  <line x1="185" y1="250" x2="275" y2="250" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2"/>
  <text x="210" y="240" fill="#38bdf8" font-family="monospace" font-size="10">BPD: 52.4mm (22w 1d)</text>
  <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">MKH ULTRASOUND • OB 2ND TRIMESTER</text>
  <text x="30" y="470" fill="#94a3b8" font-family="monospace" font-size="11">3.5 MHz CURVED • GA: 22w 1d</text>
</svg>"""

ORTHO_XRAY_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <rect width="500" height="500" fill="#05070a"/>
  <!-- Soft tissue limb contour -->
  <path d="M 180 20 L 190 480 L 310 480 L 320 20 Z" fill="#0f172a" opacity="0.7"/>
  <!-- Tibia Bone Shaft (Dense Cortical White) -->
  <rect x="225" y="40" width="45" height="420" rx="8" fill="#e2e8f0" opacity="0.9"/>
  <!-- Fibula Bone Shaft (Lateral) -->
  <rect x="285" y="60" width="16" height="380" rx="4" fill="#cbd5e1" opacity="0.8"/>
  <!-- Mid-shaft Tibial hairline hairline indicator -->
  <line x1="225" y1="260" x2="270" y2="265" stroke="#0f172a" stroke-width="2"/>
  <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">MKH ORTHOPEDIC • RIGHT TIBIA/FIBULA AP</text>
  <text x="30" y="470" fill="#94a3b8" font-family="monospace" font-size="11">R • 65 kVp • 12 mAs</text>
</svg>"""


async def seed_pacs():
    print("🌱 Connecting to Database to Seed PACS & Radiology (Module 5)...")
    async with engine.begin() as conn:
        print("🔨 Ensuring all tables are created...")
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Verify patients
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

        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # STUDY 1: Gudeta Hailu - Chest PA Digital Radiography (X-Ray)
        # -------------------------------------------------------------
        ord1_res = await session.execute(select(RadiologyOrder).where(RadiologyOrder.order_code == "RAD-2026-000301"))
        ord1 = ord1_res.scalar_one_or_none()
        if not ord1:
            ord1 = RadiologyOrder(
                order_code="RAD-2026-000301",
                patient_id=pat1.id,
                ordering_doctor_id=2, # Dr. Bekele
                modality=ModalityType.XRAY,
                body_part="Chest / Thorax",
                clinical_indication="Persistent productive cough, high fever, dyspnea. Rule out bacterial lobar pneumonia vs pulmonary TB.",
                priority="stat",
                status=RadiologyStatus.VERIFIED,
                ordered_at=now - timedelta(hours=3),
            )
            session.add(ord1)
            await session.flush()

            study1 = DICOMStudy(
                study_instance_uid="1.2.826.0.1.368.101.44912",
                radiology_order_id=ord1.id,
                patient_id=pat1.id,
                modality=ModalityType.XRAY,
                study_description="Chest PA Digital Radiography (Erect)",
                study_datetime=now - timedelta(hours=2, minutes=30),
                image_url=CHEST_XRAY_SVG,
                slice_count=1,
                window_width=400,
                window_level=40,
                radiologist_report="FINDINGS: Frontal erect radiograph demonstrates bilateral patchy opacities and alveolar airspace consolidation predominantly involving the lower lung zones. Costophrenic sulci and cardiophrenic angles are sharp with no evidence of gross pleural effusion. Cardiac silhouette is normal in contour and transverse diameter (CTR < 0.50). Trachea is midline and mediastinal contours are unremarkable. Bony thoracic cage and soft tissues intact.",
                clinical_impression="Bilateral lower lobe consolidation consistent with acute community-acquired bronchopneumonia. Clinical correlation and antimicrobial coverage recommended.",
                is_critical_finding=False,
                reporting_doctor_id=2, # Dr. Bekele Gemechu
                verified_at=now - timedelta(hours=1, minutes=45),
            )
            session.add(study1)
            print("  + Seeded Verified Study 1: Chest X-Ray (Gudeta Hailu)")

        # -------------------------------------------------------------
        # STUDY 2: Ayantu Mamo - Head & Brain 64-Slice Helical CT Scan
        # -------------------------------------------------------------
        ord2_res = await session.execute(select(RadiologyOrder).where(RadiologyOrder.order_code == "RAD-2026-000302"))
        ord2 = ord2_res.scalar_one_or_none()
        if not ord2:
            ord2 = RadiologyOrder(
                order_code="RAD-2026-000302",
                patient_id=pat2.id,
                ordering_doctor_id=2,
                modality=ModalityType.CT,
                body_part="Head & Brain",
                clinical_indication="Sudden severe headache, left-sided numbness, diabetic vascular workup. Rule out acute CVA / intracranial hemorrhage.",
                priority="urgent",
                status=RadiologyStatus.VERIFIED,
                ordered_at=now - timedelta(hours=4),
            )
            session.add(ord2)
            await session.flush()

            study2 = DICOMStudy(
                study_instance_uid="1.2.826.0.1.368.102.88214",
                radiology_order_id=ord2.id,
                patient_id=pat2.id,
                modality=ModalityType.CT,
                study_description="Brain Non-Contrast 64-Slice Helical CT",
                study_datetime=now - timedelta(hours=3, minutes=15),
                image_url=HEAD_CT_SVG,
                slice_count=128,
                window_width=80,
                window_level=40,
                radiologist_report="FINDINGS: Non-contrast volumetric CT of the brain demonstrates normal grey-white matter differentiation. No intra-axial or extra-axial hemorrhage, mass effect, or midline shift identified. Ventricular system, basal cisterns, and cerebral sulci are symmetrical and age-appropriate. No acute fracture of the calvarium or skull base. Visualized paranasal sinuses and mastoid air cells are clear.",
                clinical_impression="No acute intracranial hemorrhage or territorial infarction identified on non-contrast CT study.",
                is_critical_finding=False,
                reporting_doctor_id=2,
                verified_at=now - timedelta(hours=2),
            )
            session.add(study2)
            print("  + Seeded Verified Study 2: Head CT (Ayantu Mamo)")

        # -------------------------------------------------------------
        # STUDY 3: Chaltu Abera - Obstetrical 2nd Trimester Ultrasound
        # -------------------------------------------------------------
        ord3_res = await session.execute(select(RadiologyOrder).where(RadiologyOrder.order_code == "RAD-2026-000303"))
        ord3 = ord3_res.scalar_one_or_none()
        if not ord3:
            ord3 = RadiologyOrder(
                order_code="RAD-2026-000303",
                patient_id=pat3.id,
                ordering_doctor_id=2,
                modality=ModalityType.ULTRASOUND,
                body_part="Pelvis / Obstetrics",
                clinical_indication="ANC 2nd Trimester Fetal Anatomy scan (22 Weeks GA). Assess fetal growth, biometry, amniotic fluid, and placental site.",
                priority="routine",
                status=RadiologyStatus.IMAGE_ACQUIRED,
                ordered_at=now - timedelta(hours=1, minutes=30),
            )
            session.add(ord3)
            await session.flush()

            study3 = DICOMStudy(
                study_instance_uid="1.2.826.0.1.368.103.77192",
                radiology_order_id=ord3.id,
                patient_id=pat3.id,
                modality=ModalityType.ULTRASOUND,
                study_description="Obstetrical 2nd Trimester Color Doppler US",
                study_datetime=now - timedelta(minutes=45),
                image_url=OB_US_SVG,
                slice_count=24,
                window_width=255,
                window_level=128,
                radiologist_report=None, # In progress - to be reported by user or doctor
                clinical_impression=None,
                is_critical_finding=False,
                reporting_doctor_id=None,
                verified_at=None,
            )
            session.add(study3)
            print("  + Seeded In-Progress Study 3: Ultrasound (Chaltu Abera)")

        # -------------------------------------------------------------
        # STUDY 4: Tolessa Bekele - Awaiting X-Ray Acquisition
        # -------------------------------------------------------------
        ord4_res = await session.execute(select(RadiologyOrder).where(RadiologyOrder.order_code == "RAD-2026-000304"))
        ord4 = ord4_res.scalar_one_or_none()
        if not ord4:
            ord4 = RadiologyOrder(
                order_code="RAD-2026-000304",
                patient_id=pat4.id,
                ordering_doctor_id=2,
                modality=ModalityType.XRAY,
                body_part="Right Tibia / Fibula",
                clinical_indication="Right lower extremity trauma following fall. Localized tenderness, edema, unable to bear weight. Rule out fracture.",
                priority="urgent",
                status=RadiologyStatus.ORDERED,
                ordered_at=now - timedelta(minutes=20),
            )
            session.add(ord4)
            print("  + Seeded Pending Order 4: Orthopedic X-Ray (Tolessa Bekele)")

        await session.commit()
        print("✅ PACS & Radiology Seeding Completed Successfully!")


if __name__ == "__main__":
    asyncio.run(seed_pacs())
