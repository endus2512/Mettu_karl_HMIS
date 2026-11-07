"""
Database Seeder for Module 8: Baankii Dhiigaa fi Eegumsa Kuusaa Dhiigaa (Blood Bank & Cold Chain Management).
Seeds realistic voluntary donors, screened blood units across all 8 ABO/Rh groups, and clinical crossmatches.
"""
import os
import sys
import sqlite3
from datetime import datetime, timedelta, timezone

DB_PATHS = [
    os.path.abspath("backend/mettu_his.db"),
    os.path.abspath("mettu_his.db"),
]

def seed_database(db_path: str):
    if not os.path.exists(db_path):
        print(f"Skipping non-existent db: {db_path}")
        return

    print(f"\n--- Seeding Blood Bank & Cold Chain data in: {db_path} ---")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Normalize enum values in existing rows
    cur.execute("UPDATE blood_units SET status = UPPER(status)")
    cur.execute("UPDATE blood_crossmatches SET status = UPPER(status)")
    cur.execute("UPDATE blood_units SET component_type = 'FRESH_FROZEN_PLASMA' WHERE component_type IN ('FFP', 'ffp')")
    cur.execute("UPDATE blood_units SET component_type = 'PACKED_RBC' WHERE component_type IN ('PRBC', 'packed_rbc')")
    cur.execute("UPDATE blood_units SET component_type = 'PLATELETS' WHERE component_type IN ('platelets', 'PLATELETS')")
    conn.commit()

    # 1. Fetch available Patients
    cur.execute("SELECT id, first_name, last_name, mrn FROM patients ORDER BY id ASC LIMIT 5")
    patients = cur.fetchall()
    if not patients:
        print("Warning: No patients found, skipping patient-dependent crossmatches.")
        p1_id = 1
        p2_id = 1
        p3_id = 1
        p4_id = 1
    else:
        p1_id = patients[0][0]
        p2_id = patients[1][0] if len(patients) > 1 else p1_id
        p3_id = patients[2][0] if len(patients) > 2 else p1_id
        p4_id = patients[3][0] if len(patients) > 3 else p1_id

    # 2. Fetch Technologist User
    cur.execute("SELECT id FROM users WHERE role IN ('LAB_TECH', 'DOCTOR', 'ADMIN') LIMIT 1")
    tech_row = cur.fetchone()
    tech_id = tech_row[0] if tech_row else 1

    # 3. Seed Voluntary & Replacement Donors
    donors_data = [
        ("DNR-2026-001", "Deriba Tola", "+251911234567", "O_POS", "2026-01-15", 5, 1),
        ("DNR-2026-002", "Fatuma Ahmed", "+251922345678", "A_POS", "2026-02-10", 3, 1),
        ("DNR-2026-003", "Gemechu Kebede", "+251933456789", "O_NEG", "2026-02-28", 8, 1),
        ("DNR-2026-004", "Almaz Tadesse", "+251944567890", "B_POS", "2026-03-05", 4, 1),
        ("DNR-2026-005", "Chala Tolessa", "+251955678901", "AB_POS", "2026-01-20", 2, 1),
        ("DNR-2026-006", "Hawi Girma", "+251966789012", "A_NEG", "2026-02-14", 3, 1),
        ("DNR-2026-007", "Biruk Bekele", "+251977890123", "B_NEG", "2026-03-01", 2, 1),
        ("DNR-2026-008", "Selamawit Hailu", "+251988901234", "AB_NEG", "2026-01-10", 1, 1),
    ]

    for d_code, name, phone, bg, ldate, cnt, elig in donors_data:
        cur.execute("SELECT id FROM blood_donors WHERE donor_code = ?", (d_code,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO blood_donors (donor_code, full_name, phone_number, blood_group, last_donation_date, total_donations_count, is_eligible)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (d_code, name, phone, bg, ldate, cnt, elig))
            print(f"  + Added Donor: {name} ({bg})")

    # Donor ID mapping
    cur.execute("SELECT donor_code, id FROM blood_donors")
    donor_map = {row[0]: row[1] for row in cur.fetchall()}

    # 4. Seed Blood Units (PRBC, FFP, Platelets)
    now = datetime.now(timezone.utc)
    col_date = (now - timedelta(days=5)).isoformat()
    exp_prbc = (now + timedelta(days=30)).isoformat()
    exp_ffp = (now + timedelta(days=360)).isoformat()
    exp_plt = (now + timedelta(days=3)).isoformat()

    units_data = [
        # O_NEG (Universal PRBC Donor) - 6 units
        ("MKH-BB-26-0101", donor_map.get("DNR-2026-003"), "O_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #1 - Shelf A1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0102", donor_map.get("DNR-2026-003"), "O_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #1 - Shelf A1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0103", donor_map.get("DNR-2026-003"), "O_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 4.0, "Walk-In Cold Room Refrigerator #1 - Shelf A2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0104", donor_map.get("DNR-2026-003"), "O_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.9, "Emergency Trauma Refrigerator Shelf A", "RESERVED", 1, 1, 1, 1),
        ("MKH-BB-26-0105", donor_map.get("DNR-2026-003"), "O_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.7, "Emergency Trauma Refrigerator Shelf A", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0106", donor_map.get("DNR-2026-003"), "O_NEG", "FRESH_FROZEN_PLASMA", 250, col_date, exp_ffp, -26.4, "Ultra-Low Plasma Deep Freezer - Compartment 1", "AVAILABLE", 1, 1, 1, 1),

        # O_POS
        ("MKH-BB-26-0201", donor_map.get("DNR-2026-001"), "O_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #1 - Shelf B1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0202", donor_map.get("DNR-2026-001"), "O_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #1 - Shelf B1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0203", donor_map.get("DNR-2026-001"), "O_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.9, "Walk-In Cold Room Refrigerator #1 - Shelf B2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0204", donor_map.get("DNR-2026-001"), "O_POS", "FRESH_FROZEN_PLASMA", 250, col_date, exp_ffp, -26.2, "Ultra-Low Plasma Deep Freezer - Compartment 1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0205", donor_map.get("DNR-2026-001"), "O_POS", "PLATELETS", 200, col_date, exp_plt, 22.1, "Continuous Platelet Agitator Unit 1", "AVAILABLE", 1, 1, 1, 1),

        # A_POS
        ("MKH-BB-26-0301", donor_map.get("DNR-2026-002"), "A_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #1 - Shelf C1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0302", donor_map.get("DNR-2026-002"), "A_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #1 - Shelf C1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0303", donor_map.get("DNR-2026-002"), "A_POS", "FRESH_FROZEN_PLASMA", 250, col_date, exp_ffp, -26.0, "Ultra-Low Plasma Deep Freezer - Compartment 2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0304", donor_map.get("DNR-2026-002"), "A_POS", "PLATELETS", 200, col_date, exp_plt, 22.1, "Continuous Platelet Agitator Unit 1", "AVAILABLE", 1, 1, 1, 1),

        # A_NEG
        ("MKH-BB-26-0401", donor_map.get("DNR-2026-006"), "A_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.9, "Walk-In Cold Room Refrigerator #1 - Shelf C2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0402", donor_map.get("DNR-2026-006"), "A_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.9, "Walk-In Cold Room Refrigerator #1 - Shelf C2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0403", donor_map.get("DNR-2026-006"), "A_NEG", "FRESH_FROZEN_PLASMA", 250, col_date, exp_ffp, -26.3, "Ultra-Low Plasma Deep Freezer - Compartment 2", "AVAILABLE", 1, 1, 1, 1),

        # B_POS
        ("MKH-BB-26-0501", donor_map.get("DNR-2026-004"), "B_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.7, "Walk-In Cold Room Refrigerator #2 - Shelf A1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0502", donor_map.get("DNR-2026-004"), "B_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.7, "Walk-In Cold Room Refrigerator #2 - Shelf A1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0503", donor_map.get("DNR-2026-004"), "B_POS", "FRESH_FROZEN_PLASMA", 250, col_date, exp_ffp, -26.1, "Ultra-Low Plasma Deep Freezer - Compartment 3", "AVAILABLE", 1, 1, 1, 1),

        # B_NEG
        ("MKH-BB-26-0601", donor_map.get("DNR-2026-007"), "B_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #2 - Shelf A2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0602", donor_map.get("DNR-2026-007"), "B_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #2 - Shelf A2", "AVAILABLE", 1, 1, 1, 1),

        # AB_POS (Universal Recipient)
        ("MKH-BB-26-0701", donor_map.get("DNR-2026-005"), "AB_POS", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #2 - Shelf B1", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0702", donor_map.get("DNR-2026-005"), "AB_POS", "FRESH_FROZEN_PLASMA", 250, col_date, exp_ffp, -26.4, "Ultra-Low Plasma Deep Freezer - Compartment 3", "AVAILABLE", 1, 1, 1, 1),

        # AB_NEG
        ("MKH-BB-26-0801", donor_map.get("DNR-2026-008"), "AB_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #2 - Shelf B2", "AVAILABLE", 1, 1, 1, 1),
        ("MKH-BB-26-0802", donor_map.get("DNR-2026-008"), "AB_NEG", "PACKED_RBC", 450, col_date, exp_prbc, 3.8, "Walk-In Cold Room Refrigerator #2 - Shelf B2", "AVAILABLE", 1, 1, 1, 1),
    ]

    for bcode, d_id, bg, comp, vol, col_d, exp_d, temp, loc, st, hiv, hepb, hepc, syph in units_data:
        cur.execute("SELECT id FROM blood_units WHERE unit_barcode = ? OR unit_number = ?", (bcode, bcode))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO blood_units (
                    unit_barcode, unit_number, donor_id, blood_group, component_type,
                    volume_ml, collected_at, expiry_date, storage_temperature_celsius,
                    storage_location, status, tested_negative_hiv, tested_negative_hep_b,
                    tested_negative_hep_c, tested_negative_syphilis
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (bcode, bcode, d_id, bg, comp, vol, col_d, exp_d, temp, loc, st, hiv, hepb, hepc, syph))
            print(f"  + Added Blood Unit: {bcode} ({bg} {comp})")

    # Map Blood Units
    cur.execute("SELECT unit_barcode, id FROM blood_units")
    unit_map = {row[0]: row[1] for row in cur.fetchall()}

    # 5. Seed Crossmatches
    crossmatches_data = [
        ("XM-2026-001", p1_id, unit_map.get("MKH-BB-26-0301"), "A_POS", 1, "Indirect Antiglobulin Test (IAT) Gel Card", tech_id, "Major & minor crossmatch non-reactive. Compatible for emergency surgical transfusion.", "compatible"),
        ("XM-2026-002", p2_id, unit_map.get("MKH-BB-26-0201"), "O_POS", 1, "Saline Tube Technique at 37°C", tech_id, "Negative for agglutination or hemolysis. Approved for transfusion in ICU.", "compatible"),
        ("XM-2026-003", p4_id, unit_map.get("MKH-BB-26-0101"), "AB_POS", 1, "Gel Column Agglutination", tech_id, "Universal O_NEG donor unit verified compatible for AB_POS recipient.", "compatible"),
        ("XM-2026-004", p3_id, unit_map.get("MKH-BB-26-0502"), "A_POS", 0, "Indirect Antiglobulin Test (IAT)", tech_id, "INCOMPATIBLE: High-titer Anti-B antibodies detected in recipient plasma. Strong 3+ agglutination observed.", "incompatible"),
    ]

    for cm_code, pat_id, u_id, pat_bg, is_c, meth, t_id, notes, st in crossmatches_data:
        if not u_id:
            continue
        cur.execute("SELECT id FROM blood_crossmatches WHERE crossmatch_code = ?", (cm_code,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO blood_crossmatches (
                    crossmatch_code, patient_id, blood_unit_id, patient_blood_group,
                    is_compatible, crossmatch_method, technologist_id, notes, status, tested_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (cm_code, pat_id, u_id, pat_bg, is_c, meth, t_id, notes, st, now.isoformat()))
            print(f"  + Added Crossmatch: {cm_code} -> Compatible: {bool(is_c)}")

    conn.commit()
    conn.close()
    print(f"Seeding completed successfully for {db_path}!")

if __name__ == "__main__":
    for p in DB_PATHS:
        seed_database(p)
