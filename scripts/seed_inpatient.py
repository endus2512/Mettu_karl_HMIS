"""
Database migration & seeder for Inpatient Ward & Bed Occupancy Management.
Creates tables: wards, ward_beds, inpatient_admissions, bed_transfer_logs
Seeds clinical wards, beds, admissions, and audit logs.
"""
from datetime import datetime, timedelta, timezone
import os
import sqlite3
import sys

DB_PATHS = [
    os.path.abspath("backend/mettu_his.db"),
    os.path.abspath("mettu_his.db"),
]

def get_connection(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

def run_migration_and_seed(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (does not exist)")
        return

    print(f"Applying Inpatient migrations & seeding to {db_path}...")
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # 1. Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ward_code VARCHAR(20) NOT NULL UNIQUE,
        name_en VARCHAR(100) NOT NULL,
        name_om VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        floor_location VARCHAR(50) NOT NULL,
        head_nurse VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ward_beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ward_id INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
        bed_number VARCHAR(20) NOT NULL,
        bed_type VARCHAR(50) NOT NULL DEFAULT 'standard',
        status VARCHAR(30) NOT NULL DEFAULT 'available',
        daily_rate_etb REAL NOT NULL DEFAULT 150.0,
        oxygen_supplied BOOLEAN NOT NULL DEFAULT 1,
        has_monitor BOOLEAN NOT NULL DEFAULT 0,
        current_admission_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inpatient_admissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number VARCHAR(30) NOT NULL UNIQUE,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        ward_id INTEGER NOT NULL REFERENCES wards(id),
        bed_id INTEGER NOT NULL REFERENCES ward_beds(id),
        admitting_doctor_id INTEGER REFERENCES users(id),
        primary_nurse_id INTEGER REFERENCES users(id),
        admitting_diagnosis VARCHAR(255) NOT NULL,
        icd10_code VARCHAR(20),
        admission_type VARCHAR(50) NOT NULL DEFAULT 'emergency',
        acuity_level VARCHAR(20) NOT NULL DEFAULT 'moderate',
        diet_category VARCHAR(50) NOT NULL DEFAULT 'regular',
        payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
        admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        discharge_date TIMESTAMP,
        discharge_doctor_id INTEGER REFERENCES users(id),
        discharge_summary TEXT,
        discharge_condition VARCHAR(50),
        total_days INTEGER NOT NULL DEFAULT 0,
        total_bed_charge_etb REAL NOT NULL DEFAULT 0.0,
        status VARCHAR(30) NOT NULL DEFAULT 'admitted',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bed_transfer_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_id INTEGER NOT NULL REFERENCES inpatient_admissions(id) ON DELETE CASCADE,
        from_ward_id INTEGER NOT NULL REFERENCES wards(id),
        from_bed_id INTEGER NOT NULL REFERENCES ward_beds(id),
        to_ward_id INTEGER NOT NULL REFERENCES wards(id),
        to_bed_id INTEGER NOT NULL REFERENCES ward_beds(id),
        transferred_by_id INTEGER REFERENCES users(id),
        transfer_reason VARCHAR(255) NOT NULL,
        transferred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # 2. Seed Wards
    cursor.execute("SELECT COUNT(*) FROM wards")
    ward_count = cursor.fetchone()[0]

    wards_data = [
        ("ICU", "Intensive Care Unit (ICU)", "Kutaa Yaala Cimaa (ICU)", "Critical Care", "Block C - 3rd Floor", "Sr. Nurse Lensa Tadesse"),
        ("SURG-W", "Surgical Inpatient Ward", "Wardi Baqaqsaa", "General Surgery & Ortho", "Block B - 2nd Floor", "Nurse Chaltu Abera"),
        ("MED-W", "Medical Inpatient Ward", "Wardi Yaala Keessoo", "Internal Medicine", "Block A - 1st Floor", "Nurse Tolera Dida"),
        ("MAT-W", "Maternity & C-Section Ward", "Wardi Harmootaa fi Da'umsaa", "Obstetrics & Gynecology", "Maternal Wing - 1st Floor", "Midwife Aster Bekele"),
        ("PED-W", "Pediatric Inpatient Ward", "Wardi Daa'immanii", "Pediatrics & Child Health", "Block A - Ground Floor", "Nurse Hawi Gemechu"),
        ("EMER-BAY", "Emergency Observation Bay", "Kutaa Yaada Triage & Resus", "Emergency & Trauma", "ED Complex - Ground Floor", "Nurse Yohannes Kassa"),
    ]

    for code, name_en, name_om, dept, floor, nurse in wards_data:
        cursor.execute("SELECT id FROM wards WHERE ward_code = ?", (code,))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
                INSERT INTO wards (ward_code, name_en, name_om, department, floor_location, head_nurse, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (code, name_en, name_om, dept, floor, nurse))
    conn.commit()

    # Get Ward IDs
    cursor.execute("SELECT id, ward_code FROM wards")
    ward_id_map = {r[1]: r[0] for r in cursor.fetchall()}

    # 3. Seed Beds if none exist
    cursor.execute("SELECT COUNT(*) FROM ward_beds")
    bed_count = cursor.fetchone()[0]

    if bed_count == 0:
        beds_to_create = [
            # ICU Beds (4)
            (ward_id_map["ICU"], "ICU-01", "icu_ventilated", "available", 500.0, True, True),
            (ward_id_map["ICU"], "ICU-02", "icu_ventilated", "available", 500.0, True, True),
            (ward_id_map["ICU"], "ICU-03", "icu_ventilated", "available", 500.0, True, True),
            (ward_id_map["ICU"], "ICU-04", "isolation_negative_pressure", "available", 650.0, True, True),

            # Surgical Ward Beds (6)
            (ward_id_map["SURG-W"], "SURG-01", "standard", "cleaning", 200.0, True, False),
            (ward_id_map["SURG-W"], "SURG-02", "standard", "available", 200.0, True, False),
            (ward_id_map["SURG-W"], "SURG-03", "standard", "available", 200.0, True, False),
            (ward_id_map["SURG-W"], "SURG-04", "standard", "available", 200.0, True, False),
            (ward_id_map["SURG-W"], "SURG-05", "standard", "available", 200.0, True, False),
            (ward_id_map["SURG-W"], "SURG-06", "standard", "maintenance", 200.0, False, False),

            # Medical Ward Beds (6)
            (ward_id_map["MED-W"], "MED-01", "standard", "available", 150.0, True, False),
            (ward_id_map["MED-W"], "MED-02", "standard", "available", 150.0, True, False),
            (ward_id_map["MED-W"], "MED-03", "standard", "available", 150.0, True, False),
            (ward_id_map["MED-W"], "MED-04", "standard", "available", 150.0, True, False),
            (ward_id_map["MED-W"], "MED-05", "standard", "cleaning", 150.0, True, False),
            (ward_id_map["MED-W"], "MED-06", "standard", "available", 150.0, True, False),

            # Maternity Beds (4)
            (ward_id_map["MAT-W"], "MAT-01", "delivery_bed", "available", 180.0, True, True),
            (ward_id_map["MAT-W"], "MAT-02", "delivery_bed", "available", 180.0, True, True),
            (ward_id_map["MAT-W"], "MAT-03", "standard", "available", 150.0, True, False),
            (ward_id_map["MAT-W"], "MAT-04", "standard", "available", 150.0, True, False),

            # Pediatric Beds (4)
            (ward_id_map["PED-W"], "PED-01", "pediatric_crib", "available", 120.0, True, False),
            (ward_id_map["PED-W"], "PED-02", "pediatric_crib", "available", 120.0, True, False),
            (ward_id_map["PED-W"], "PED-03", "pediatric_crib", "available", 120.0, True, False),
            (ward_id_map["PED-W"], "PED-04", "standard", "available", 120.0, True, False),

            # Emergency Observation Beds (4)
            (ward_id_map["EMER-BAY"], "ER-01", "standard", "available", 250.0, True, True),
            (ward_id_map["EMER-BAY"], "ER-02", "standard", "available", 250.0, True, True),
            (ward_id_map["EMER-BAY"], "ER-03", "standard", "available", 250.0, True, True),
            (ward_id_map["EMER-BAY"], "ER-04", "standard", "available", 250.0, True, True),
        ]

        cursor.executemany("""
            INSERT INTO ward_beds (ward_id, bed_number, bed_type, status, daily_rate_etb, oxygen_supplied, has_monitor)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, beds_to_create)
        conn.commit()
        print(f"Seeded {len(beds_to_create)} ward beds.")

    # Get bed map
    cursor.execute("SELECT id, bed_number, ward_id FROM ward_beds")
    bed_map = {r[1]: (r[0], r[2]) for r in cursor.fetchall()}

    # 4. Seed Inpatient Admissions if none exist
    cursor.execute("SELECT COUNT(*) FROM inpatient_admissions")
    adm_count = cursor.fetchone()[0]

    # Find sample doctor & nurse
    cursor.execute("SELECT id FROM users WHERE role = 'doctor' LIMIT 1")
    doc_row = cursor.fetchone()
    doc_id = doc_row[0] if doc_row else 1

    cursor.execute("SELECT id FROM users WHERE role = 'nurse' LIMIT 1")
    nurse_row = cursor.fetchone()
    nurse_id = nurse_row[0] if nurse_row else 2

    # Check patients 1..4
    cursor.execute("SELECT id, mrn, first_name, last_name FROM patients ORDER BY id LIMIT 5")
    patients = cursor.fetchall()

    if adm_count == 0 and len(patients) >= 4:
        now = datetime.now(timezone.utc)
        cases = [
            # Gudeta Hailu -> Medical Ward Bed MED-02
            {
                "adm_num": "ADM-2026-000401",
                "patient_id": patients[0]["id"],
                "bed_number": "MED-02",
                "diagnosis": "Right Lower Lobe Pneumonia with Moderate Hypoxemia",
                "icd10": "J18.9",
                "adm_type": "emergency",
                "acuity": "high",
                "diet": "regular",
                "payment": "cbhi",
                "days_ago": 3,
            },
            # Ayantu Mamo -> ICU Bed ICU-01
            {
                "adm_num": "ADM-2026-000402",
                "patient_id": patients[1]["id"],
                "bed_number": "ICU-01",
                "diagnosis": "Polytrauma, Subdural Hematoma Observation & Mechanical Ventilation",
                "icd10": "S06.5",
                "adm_type": "emergency",
                "acuity": "critical",
                "diet": "npo_fasting",
                "payment": "cash",
                "days_ago": 1,
            },
            # Chaltu Abera -> Maternity Bed MAT-01
            {
                "adm_num": "ADM-2026-000403",
                "patient_id": patients[2]["id"],
                "bed_number": "MAT-01",
                "diagnosis": "Severe Preeclampsia in 2nd Trimester with BP Elevation (160/100)",
                "icd10": "O14.1",
                "adm_type": "referral",
                "acuity": "moderate",
                "diet": "renal",
                "payment": "cbhi",
                "days_ago": 2,
            },
            # Tolessa Bekele -> Surgical Bed SURG-03
            {
                "adm_num": "ADM-2026-000404",
                "patient_id": patients[3]["id"],
                "bed_number": "SURG-03",
                "diagnosis": "Post-Op Open Reduction Internal Fixation (ORIF) Right Tibial Fracture",
                "icd10": "S82.2",
                "adm_type": "elective_surgical",
                "acuity": "stable",
                "diet": "regular",
                "payment": "cash",
                "days_ago": 4,
            },
        ]

        for c in cases:
            bed_id, ward_id = bed_map[c["bed_number"]]
            adm_date = (now - timedelta(days=c["days_ago"])).strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                INSERT INTO inpatient_admissions (
                    admission_number, patient_id, ward_id, bed_id,
                    admitting_doctor_id, primary_nurse_id, admitting_diagnosis, icd10_code,
                    admission_type, acuity_level, diet_category, payment_method,
                    admission_date, status, total_days, total_bed_charge_etb
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admitted', 0, 0.0)
            """, (
                c["adm_num"], c["patient_id"], ward_id, bed_id,
                doc_id, nurse_id, c["diagnosis"], c["icd10"],
                c["adm_type"], c["acuity"], c["diet"], c["payment"],
                adm_date
            ))
            adm_id = cursor.lastrowid

            # Update bed to occupied
            cursor.execute("""
                UPDATE ward_beds
                SET status = 'occupied', current_admission_id = ?
                WHERE id = ?
            """, (adm_id, bed_id))

        # Also seed 1 transfer log for audit trace
        cursor.execute("SELECT id FROM inpatient_admissions WHERE admission_number = 'ADM-2026-000404'")
        tolesa_adm = cursor.fetchone()
        if tolesa_adm:
            er_bed_id, er_ward_id = bed_map["ER-01"]
            surg_bed_id, surg_ward_id = bed_map["SURG-03"]
            cursor.execute("""
                INSERT INTO bed_transfer_logs (
                    admission_id, from_ward_id, from_bed_id, to_ward_id, to_bed_id,
                    transferred_by_id, transfer_reason, transferred_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tolesa_adm[0], er_ward_id, er_bed_id, surg_ward_id, surg_bed_id,
                doc_id, "Patient stabilized in ED Resus bay; transferred to Surgical Inpatient Ward post-cast stabilization",
                (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")
            ))

        conn.commit()
        print(f"Seeded 4 active inpatient admissions and transfer logs.")

    conn.close()
    print(f"Finished seeding {db_path} successfully!")

if __name__ == "__main__":
    for path in DB_PATHS:
        run_migration_and_seed(path)
