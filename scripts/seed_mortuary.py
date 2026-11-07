"""
Database Seeder for Module 10: Hospital Mortuary, Cold Vaults, Autopsy, and Legal Release.
Seeds both backend/mettu_his.db and ./mettu_his.db with production clinical records.
"""
import sqlite3
from datetime import datetime, timezone, timedelta

DATABASES = ["backend/mettu_his.db", "mettu_his.db"]

VAULTS_DATA = [
    ("VAULT-01", "Bay 1 Top", 2.8, "OCCUPIED"),
    ("VAULT-02", "Bay 1 Bottom", 3.2, "OCCUPIED"),
    ("VAULT-03", "Bay 2 Top", 2.6, "VACANT"),
    ("VAULT-04", "Bay 2 Bottom", 3.0, "VACANT"),
    ("VAULT-05", "Bay 3 Top", 3.4, "OCCUPIED"),
    ("VAULT-06", "Bay 3 Bottom", 2.9, "VACANT"),
    ("VAULT-07", "Bay 4 Top", 3.1, "VACANT"),
    ("VAULT-08", "Bay 4 Bottom", 4.2, "MAINTENANCE"),
]

def seed_db(db_path: str):
    print(f"--- Seeding Mortuary in {db_path} ---")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Clear old demo records
    cur.execute("DELETE FROM mortuary_records")
    cur.execute("DELETE FROM body_vaults")

    # 2. Insert Vaults
    vault_ids = {}
    for code, bay, temp, status in VAULTS_DATA:
        cur.execute(
            """
            INSERT INTO body_vaults (vault_code, vault_number, bay_name, temperature_celsius, status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (code, code, bay, temp, status)
        )
        vault_ids[code] = cur.lastrowid

    now = datetime.now(timezone.utc)
    t_1d = now - timedelta(days=1)
    t_2d = now - timedelta(days=2)
    t_3d = now - timedelta(days=3)
    t_5d = now - timedelta(days=5)

    # 3. Insert Mortuary Records
    records = [
        (
            "MORT-2026-0041",
            "Bekele Shiferaw",
            "MALE",
            t_1d.isoformat(),
            "Acute Myocardial Infarction",
            "Dr. Chala Worku",
            vault_ids["VAULT-01"],
            "DC-MKH-2026-0041",
            0,
            None,
            None,
            None,
            None,
            None,
            t_1d.isoformat(),
            None,
            None,
            None,
            "Tigist Bekele (Daughter)",
            "+251911223344",
            0,
        ),
        (
            "MORT-2026-0042",
            "Aberash Worku",
            "FEMALE",
            t_2d.isoformat(),
            "Severe Septic Shock secondary to Peritonitis",
            "Dr. Hawi Benti",
            vault_ids["VAULT-02"],
            "DC-MKH-2026-0042",
            0,
            None,
            None,
            None,
            None,
            None,
            t_2d.isoformat(),
            None,
            None,
            None,
            "Kebede Worku (Brother)",
            "+251922334455",
            0,
        ),
        (
            "MORT-2026-0043",
            "Girma Tufa",
            "MALE",
            t_3d.isoformat(),
            "Multiple Severe Blunt Force Trauma (Motor Vehicle Collision)",
            "Dr. Tolosa Dida",
            vault_ids["VAULT-05"],
            "DC-MKH-2026-0043",
            1,
            "Forensic autopsy confirmed basilar skull fracture and extensive retroperitoneal hemorrhage. Toxicological screen negative for ethanol.",
            "Dr. Daniel Gemechu (Forensic Pathologist)",
            t_2d.isoformat(),
            None,
            "POL-MK-2026-891",
            t_3d.isoformat(),
            None,
            None,
            None,
            "Gudeta Tufa (Elder Brother)",
            "+251933445566",
            0,
        ),
        (
            "MORT-2026-0038",
            "Diriba Olani",
            "MALE",
            t_5d.isoformat(),
            "End-Stage Renal Disease (ESRD) with Uremic Encephalopathy",
            "Dr. Chala Worku",
            None,
            "DC-MKH-2026-0038",
            0,
            None,
            None,
            None,
            "BP-MKH-0038",
            None,
            t_5d.isoformat(),
            (now - timedelta(days=1)).isoformat(),
            "Tolasa Diriba",
            "Son",
            "Tolasa Diriba (Son)",
            "+251944556677",
            1,
        ),
        (
            "MORT-2026-0039",
            "Fatuma Ahmed",
            "FEMALE",
            (now - timedelta(days=4)).isoformat(),
            "Acute Respiratory Distress Syndrome (ARDS) secondary to Severe Pneumonia",
            "Dr. Hawi Benti",
            None,
            "DC-MKH-2026-0039",
            0,
            None,
            None,
            None,
            "BP-MKH-0039",
            None,
            (now - timedelta(days=4)).isoformat(),
            (now - timedelta(days=2)).isoformat(),
            "Mohammed Ahmed",
            "Husband",
            "Mohammed Ahmed (Husband)",
            "+251955667788",
            1,
        ),
    ]

    for rec in records:
        cur.execute(
            """
            INSERT INTO mortuary_records (
                tag_number, deceased_name, gender, datetime_of_death, cause_of_death,
                declaring_doctor_name, body_vault_id, death_certificate_number,
                is_autopsy_conducted, autopsy_findings, pathologist_name, autopsy_date,
                burial_permit_number, police_case_number, received_at, released_at,
                released_to_name, released_to_relationship, contact_kin_name,
                contact_kin_phone, released_to_kin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rec
        )

    conn.commit()
    conn.close()
    print(f"Successfully seeded {len(VAULTS_DATA)} body vaults and {len(records)} mortuary records in {db_path}!")

if __name__ == "__main__":
    for db in DATABASES:
        seed_db(db)
