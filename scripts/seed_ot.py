"""
Database Seeder for Module 7: Operation Theatre (OT) & CSSD Sterilization.
Seeds realistic clinical suites, surgeries, autoclave batches, and sterile instrument packs.
"""
import sys
import os
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

    print(f"\n--- Seeding OT & CSSD data in: {db_path} ---")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Ensure Clinical Users exist
    users_to_add = [
        ("dr_sisay", "dr_sisay@mettu-his.et", "Dr. Sisay Lemma", "DOCTOR"),
        ("dr_chala", "dr_chala@mettu-his.et", "Dr. Chala Gemechu", "DOCTOR"),
        ("dr_helen", "dr_helen@mettu-his.et", "Dr. Helen Kassa", "DOCTOR"),
        ("nurse_derartu", "nurse_derartu@mettu-his.et", "Nurse Derartu Tulu", "NURSE"),
    ]
    now_iso = datetime.now(timezone.utc).isoformat()
    for username, email, full_name, role in users_to_add:
        cur.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        if not row:
            cur.execute("""
                INSERT INTO users (username, email, full_name, hashed_password, role, is_active, failed_attempts, is_mfa_enabled, created_at, updated_at)
                VALUES (?, ?, ?, '$2b$12$eX9u5G6a2wZJ9zB5z6b0EuY1QhO4eK.9jC2Dq.p5a0Wz0tV5Ym6O', ?, 1, 0, 0, ?, ?)
            """, (username, email, full_name, role, now_iso, now_iso))
            print(f"Inserted staff user: {full_name} ({role})")

    # Fetch User IDs
    cur.execute("SELECT id, username, full_name FROM users")
    user_map = {row[1]: row[0] for row in cur.fetchall()}
    dr_bekele_id = user_map.get("dr_bekele", 2)
    dr_sisay_id = user_map.get("dr_sisay", dr_bekele_id)
    dr_chala_id = user_map.get("dr_chala", dr_bekele_id)
    dr_helen_id = user_map.get("dr_helen", dr_bekele_id)
    nurse_chaltu_id = user_map.get("nurse_chaltu", 3)
    nurse_derartu_id = user_map.get("nurse_derartu", nurse_chaltu_id)

    # 2. Operating Rooms Suites
    rooms_data = [
        (1, "OT Suite 1 (Major Trauma & Emergency)", "OT-1", "Trauma & General Surgery", "Block B - 2nd Floor", 1),
        (2, "OT Suite 2 (Orthopedics & Complex Trauma)", "OT-2", "Orthopedics & Spine", "Block B - 2nd Floor", 1),
        (3, "OT Suite 3 (Maternity & Obstetric OT)", "OT-3", "Obstetrics & Gynecology", "Block B - 2nd Floor", 1),
        (4, "OT Suite 4 (Ophthalmic & ENT Micro-Surgery)", "OT-4", "Ophthalmology & ENT", "Block B - 2nd Floor", 1),
    ]

    for rid, name, code, spec, flr, active in rooms_data:
        cur.execute("SELECT id FROM operating_rooms WHERE id = ?", (rid,))
        if cur.fetchone():
            cur.execute("""
                UPDATE operating_rooms 
                SET name = ?, room_code = ?, specialty = ?, floor_location = ?, is_active = ?
                WHERE id = ?
            """, (name, code, spec, flr, active, rid))
            print(f"Updated OT Suite: {code} - {name}")
        else:
            cur.execute("""
                INSERT INTO operating_rooms (id, name, room_code, specialty, floor_location, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (rid, name, code, spec, flr, active))
            print(f"Inserted OT Suite: {code} - {name}")

    # Fetch Patients
    cur.execute("SELECT id, mrn, first_name, last_name FROM patients")
    patients = cur.fetchall()
    if not patients:
        print("Error: No patients found to link surgical bookings!")
        conn.close()
        return

    patient_map = {row[1]: row[0] for row in patients}
    p_gudeta = patient_map.get("MKH-2026-000101", patients[0][0])
    p_ayantu = patient_map.get("MKH-2026-000102", patients[1][0] if len(patients) > 1 else patients[0][0])
    p_chaltu = patient_map.get("MKH-2026-000103", patients[2][0] if len(patients) > 2 else patients[0][0])
    p_tolessa = patient_map.get("MKH-2026-000104", patients[3][0] if len(patients) > 3 else patients[0][0])

    # 3. CSSD Batches
    now_utc = datetime.now(timezone.utc)
    cur.execute("SELECT id FROM cssd_batches WHERE id IN (1, 2)")
    existing_batches = [r[0] for r in cur.fetchall()]

    if 1 not in existing_batches:
        cur.execute("""
            INSERT INTO cssd_batches (id, batch_code, sterilizer_type, sterilizer_unit_name, temperature_celsius, pressure_bar, cycle_duration_min, biological_indicator_passed, sterilized_at, operator_id)
            VALUES (1, 'CSSD-2026-A101', 'steam_autoclave', 'Tuttnauer 5075 Steam Autoclave', 134.0, 2.2, 45, 1, ?, ?)
        """, (now_utc.isoformat(), nurse_chaltu_id))
    else:
        cur.execute("""
            UPDATE cssd_batches 
            SET batch_code = 'CSSD-2026-A101', sterilizer_type = 'steam_autoclave', sterilizer_unit_name = 'Tuttnauer 5075 Steam Autoclave',
                temperature_celsius = 134.0, pressure_bar = 2.2, cycle_duration_min = 45, biological_indicator_passed = 1
            WHERE id = 1
        """)

    if 2 not in existing_batches:
        cur.execute("""
            INSERT INTO cssd_batches (id, batch_code, sterilizer_type, sterilizer_unit_name, temperature_celsius, pressure_bar, cycle_duration_min, biological_indicator_passed, sterilized_at, operator_id)
            VALUES (2, 'CSSD-2026-B102', 'plasma', 'Sterrad 100NX Hydrogen Peroxide Plasma', 55.0, 0.8, 35, 1, ?, ?)
        """, ((now_utc - timedelta(hours=3)).isoformat(), nurse_derartu_id))
        print("Inserted CSSD batch 2 (Plasma)")

    # 4. Sterile Packs
    sterile_packs_data = [
        (1, "PACK-CRAN-01", 1, "Craniotomy & Neuro-Microsurgical Instrument Set", (now_utc + timedelta(days=30)).isoformat(), "sterile"),
        (2, "PACK-ORTHO-02", 1, "Major Orthopedic ORIF & Bone Drill Set", (now_utc + timedelta(days=28)).isoformat(), "sterile"),
        (3, "PACK-CS-03", 1, "Emergency Caesarean Section Set", (now_utc + timedelta(days=25)).isoformat(), "sterile"),
        (4, "PACK-LAP-04", 1, "Major Laparotomy & Abdominal Retractor Set", (now_utc + timedelta(days=21)).isoformat(), "used"),
        (5, "PACK-VASC-05", 2, "Vascular Clamp & Fine Microsuture Set", (now_utc + timedelta(days=15)).isoformat(), "sterile"),
        (6, "PACK-ENT-06", 2, "Tympanoplasty & Mastoid Micro-Ear Set", (now_utc + timedelta(days=20)).isoformat(), "sterile"),
    ]

    for pid, pcode, bid, pname, exp, status in sterile_packs_data:
        cur.execute("SELECT id FROM sterile_packs WHERE id = ?", (pid,))
        if cur.fetchone():
            cur.execute("""
                UPDATE sterile_packs 
                SET pack_code = ?, batch_id = ?, pack_name = ?, expiry_date = ?, status = ?
                WHERE id = ?
            """, (pcode, bid, pname, exp, status, pid))
            print(f"Updated Sterile Pack: {pcode} - {pname}")
        else:
            cur.execute("""
                INSERT INTO sterile_packs (id, pack_code, batch_id, pack_name, expiry_date, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (pid, pcode, bid, pname, exp, status))
            print(f"Inserted Sterile Pack: {pcode} - {pname}")

    # 5. Surgical Bookings
    bookings_data = [
        (
            1,
            "SURG-2026-0101",
            p_ayantu,
            1, # OT Suite 1
            "Emergency Exploratory Craniotomy & Subdural Hematoma Evacuation",
            dr_bekele_id,
            dr_sisay_id,
            nurse_chaltu_id,
            (now_utc - timedelta(minutes=45)).isoformat(),
            (now_utc + timedelta(minutes=75)).isoformat(),
            "in_surgery",
            1, # WHO Verified
            "Bilateral temporal burr holes placed followed by frontoparietal craniotomy. Acute subdural hematoma (approx 65 ml) evacuated with warm saline lavage. Dura closed watertight.",
            120, # blood loss ml
            "Acute high-pressure subdural hematoma evacuated. Brain pulsation restored promptly after decompression.",
            "Titanium cranial fixation plates x 3",
        ),
        (
            2,
            "SURG-2026-0102",
            p_tolessa,
            2, # OT Suite 2
            "Right Femur Shaft Fracture Open Reduction Internal Fixation (ORIF)",
            dr_chala_id,
            dr_sisay_id,
            nurse_derartu_id,
            (now_utc + timedelta(minutes=15)).isoformat(),
            (now_utc + timedelta(hours=3)).isoformat(),
            "in_prep",
            0, # WHO not yet completed
            "Anesthesia induction ongoing. Patient positioned in supine on traction orthopedic table. C-arm fluoroscopy calibrated.",
            0,
            "Midshaft transverse comminuted femur fracture awaiting anatomical reduction.",
            "Synthes 12-hole 4.5mm LC-DCP Plate + 9 cortical screws",
        ),
        (
            3,
            "SURG-2026-0103",
            p_chaltu,
            3, # OT Suite 3
            "Emergency Caesarean Section (Twin Gestation, Fetal Distress)",
            dr_helen_id,
            dr_sisay_id,
            nurse_chaltu_id,
            (now_utc + timedelta(hours=1, minutes=30)).isoformat(),
            (now_utc + timedelta(hours=3, minutes=30)).isoformat(),
            "scheduled",
            0,
            None,
            0,
            "37-week diamniotic twin pregnancy. Twin A in breech presentation with active variable decelerations.",
            "None / Polyglycolic acid sutures",
        ),
        (
            4,
            "SURG-2026-0100",
            p_gudeta,
            1, # OT Suite 1
            "Laparoscopic Cholecystectomy & Intraoperative Cholangiogram",
            dr_bekele_id,
            dr_sisay_id,
            nurse_derartu_id,
            (now_utc - timedelta(hours=5)).isoformat(),
            (now_utc - timedelta(hours=2, minutes=30)).isoformat(),
            "completed",
            1,
            "Standard 4-port laparoscopic cholecystectomy performed. Critical view of safety achieved. Cystic duct and artery clipped twice and transected.",
            65,
            "Acute gangrenous cholecystitis with dense pericholecystic adhesions. Common bile duct clear on cholangiogram.",
            "Titanium Ligating Hemoclips x 4",
        ),
    ]

    for bid, bcode, pid, rid, proc, doc_id, anes_id, nurse_id, start_t, end_t, stat, who, notes, blood, findings, implants in bookings_data:
        cur.execute("SELECT id FROM surgical_bookings WHERE id = ?", (bid,))
        if cur.fetchone():
            cur.execute("""
                UPDATE surgical_bookings
                SET booking_code = ?, patient_id = ?, room_id = ?, procedure_name = ?,
                    lead_surgeon_id = ?, anesthesiologist_id = ?, scrub_nurse_id = ?,
                    scheduled_start = ?, scheduled_end = ?, status = ?,
                    who_safety_checklist_verified = ?, post_op_notes = ?,
                    blood_loss_ml = ?, findings = ?, implants_used = ?
                WHERE id = ?
            """, (bcode, pid, rid, proc, doc_id, anes_id, nurse_id, start_t, end_t, stat, who, notes, blood, findings, implants, bid))
            print(f"Updated Surgical Booking: {bcode} - {proc}")
        else:
            cur.execute("""
                INSERT INTO surgical_bookings (
                    id, booking_code, patient_id, room_id, procedure_name,
                    lead_surgeon_id, anesthesiologist_id, scrub_nurse_id,
                    scheduled_start, scheduled_end, status,
                    who_safety_checklist_verified, post_op_notes,
                    blood_loss_ml, findings, implants_used
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (bid, bcode, pid, rid, proc, doc_id, anes_id, nurse_id, start_t, end_t, stat, who, notes, blood, findings, implants))
            print(f"Inserted Surgical Booking: {bcode} - {proc}")

    conn.commit()
    conn.close()
    print(f"Successfully seeded {db_path}!")

if __name__ == "__main__":
    for p in DB_PATHS:
        seed_database(p)
