"""
Database Seeder for Module 9: Sarara Hatattamaa 907, Triage & Ergaa Ambalaansii (EMS & Ambulance Fleet).
Seeds realistic emergency fleet, active 907 hotline incident calls, GPS locations, and paramedic run records.
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

    print(f"\n--- Seeding EMS & Ambulance Fleet data in: {db_path} ---")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Normalize existing status & triage levels
    cur.execute("UPDATE emergency_calls SET status = UPPER(status), triage_level = UPPER(triage_level)")
    conn.commit()

    now = datetime.now(timezone.utc)

    # 1. Seed Ambulance Fleet
    ambulances = [
        ("AMB-01", "ET-3-10294", "Toyota Land Cruiser HZJ78", "advanced_life_support", 1, "Dawit Tola", "+251911223344", "Paramedic Dawit & Nurse Beth", 1, 8.3012, 35.5845, 92, 210),
        ("AMB-02", "ET-3-10295", "Toyota Land Cruiser HZJ78", "advanced_life_support", 1, "Fikadu Worku", "+251922334455", "Paramedic Fikadu & EMT Abebe", 0, 8.2890, 35.5680, 80, 195),
        ("AMB-03", "ET-3-88219", "Nissan Patrol 4WD", "basic_life_support", 0, "Yohannes Hailu", "+251933445566", "EMT Yohannes & Driver Kedir", 1, 8.3005, 35.5830, 88, 180),
        ("AMB-04", "ET-3-88901", "Mercedes-Benz Sprinter Mobile ICU", "neonatal_pediatric_icu", 1, "Sisay Lemma", "+251944556677", "Dr. Sisay & Nurse Selam", 1, 8.3015, 35.5850, 95, 220),
        ("AMB-05", "ET-3-44102", "Toyota Hilux Heavy Duty 4x4", "rural_trauma_retrieval", 1, "Gemechu Desta", "+251955667788", "Paramedic Gemechu & Driver Tola", 0, 8.2710, 35.5920, 75, 190),
    ]

    for sign, plate, model, vtype, als, dname, phone, crew, avail, lat, lon, fuel, o2 in ambulances:
        cur.execute("SELECT id FROM ambulances WHERE plate_number = ?", (plate,))
        existing = cur.fetchone()
        if not existing:
            cur.execute("""
                INSERT INTO ambulances (
                    call_sign, plate_number, vehicle_model, vehicle_type, is_als,
                    driver_name, driver_phone, assigned_crew, is_available,
                    current_lat, current_lon, current_latitude, current_longitude,
                    fuel_level_percent, oxygen_tank_bar, last_gps_update
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (sign, plate, model, vtype, als, dname, phone, crew, avail, lat, lon, lat, lon, fuel, o2, now.isoformat()))
            print(f"  + Added Ambulance: {sign} ({plate}) - {vtype}")
        else:
            cur.execute("""
                UPDATE ambulances SET
                    call_sign = ?, vehicle_model = ?, vehicle_type = ?, is_als = ?,
                    driver_name = ?, driver_phone = ?, assigned_crew = ?, is_available = ?,
                    current_lat = ?, current_lon = ?, current_latitude = ?, current_longitude = ?,
                    fuel_level_percent = ?, oxygen_tank_bar = ?, last_gps_update = ?
                WHERE id = ?
            """, (sign, model, vtype, als, dname, phone, crew, avail, lat, lon, lat, lon, fuel, o2, now.isoformat(), existing[0]))

    # Get ambulance mapping
    cur.execute("SELECT call_sign, id FROM ambulances")
    amb_map = {row[0]: row[1] for row in cur.fetchall()}

    # 2. Seed 907 Emergency Calls
    t1 = (now - timedelta(minutes=18)).isoformat()
    t2 = (now - timedelta(minutes=35)).isoformat()
    t3 = (now - timedelta(hours=2)).isoformat()
    t4 = (now - timedelta(hours=3, minutes=10)).isoformat()
    t5 = (now - timedelta(hours=4, minutes=45)).isoformat()

    calls = [
        (
            "EMS-2026-0901",
            "Obbo Chala Worku (Traffic Police)",
            "+251911234567",
            "Mettu University Main Gate Roundabout",
            8.2985,
            35.5841,
            "RED",
            "High-velocity minibus vs truck collision, multiple passengers trapped with severe head trauma & hemorrhagic shock",
            "en_route",
            "EN_ROUTE",
            amb_map.get("AMB-02"),
            t1,
            t1,
            None,
            "Patient extricated, cervical collar applied, bilateral 14G IV access with 1000ml Ringer Lactate, SpO2 91% on 15L non-rebreather mask",
            "BP 85/50, HR 132 bpm, SpO2 91%, GCS 8/15",
        ),
        (
            "EMS-2026-0902",
            "Adde Fatuma Ahmed (Market Shopkeeper)",
            "+251922345678",
            "Mettu Central Market, Grain Mill Area",
            8.3050,
            35.5810,
            "RED",
            "Elderly male 64yo sudden onset severe retrosternal crushing chest pain radiating to left arm and jaw, diaphoresis",
            "on_scene",
            "ON_SCENE",
            amb_map.get("AMB-05"),
            t2,
            t2,
            None,
            "12-lead ECG pre-hospital transmission confirms anterior STEMI, Aspirin 300mg chewed, Nitroglycerin sublingual given",
            "BP 140/90, HR 96 bpm, SpO2 97%, GCS 15/15",
        ),
        (
            "EMS-2026-0903",
            "Nurse Derartu Tulu (Sor Clinic)",
            "+251933456789",
            "Sor Woreda Health Center",
            8.2650,
            35.6120,
            "YELLOW",
            "Primigravida 39 weeks labor obstructed, non-reassuring fetal heart tones requiring emergency hospital C-section transfer",
            "arrived_hospital",
            "ARRIVED_HOSPITAL",
            amb_map.get("AMB-04"),
            t3,
            t3,
            (now - timedelta(minutes=45)).isoformat(),
            "Left lateral tilt position, oxygen therapy initiated, continuous maternal-fetal monitoring during transfer",
            "BP 125/80, HR 88 bpm, FHR 110 bpm, GCS 15/15",
        ),
        (
            "EMS-2026-0904",
            "Dirriba Hailu",
            "+251944567890",
            "Bedele Road Km 12 near Coffee Plantation",
            8.3240,
            35.5990,
            "YELLOW",
            "Fall from tree 4 meters, closed deformity right femur, distal pulse palpable, immobilized with traction splint",
            "pending",
            "RECEIVED",
            None,
            t4,
            None,
            None,
            "Awaiting dispatch allocation. Paramedic telephone guidance given to keep patient immobilized and warm.",
            "Stable vitals reported by bystander",
        ),
        (
            "EMS-2026-0905",
            "Kenenisa Bekele",
            "+251955678901",
            "Gore Town Junction",
            8.2810,
            35.5450,
            "GREEN",
            "Minor motorcycle slide, superficial road rash abrasions, no loss of consciousness",
            "pending",
            "RECEIVED",
            None,
            t5,
            None,
            None,
            "Wound cleaned and bandaged by local first aid. Ambulatory without distress.",
            "BP 120/80, HR 76 bpm, GCS 15/15",
        ),
    ]

    for inc, cname, cphone, loc, lat, lon, tri, comp, disp_st, st, amb_id, rec_at, disp_at, arr_at, notes, vitals in calls:
        cur.execute("SELECT id FROM emergency_calls WHERE incident_code = ?", (inc,))
        existing = cur.fetchone()
        if not existing:
            cur.execute("""
                INSERT INTO emergency_calls (
                    incident_code, caller_name, caller_phone, location_address,
                    incident_location, location_lat, location_lon, triage_level,
                    chief_complaint, emergency_description, status, dispatch_status,
                    ambulance_id, received_at, dispatched_at, arrived_hospital_at,
                    paramedic_notes, vital_signs_summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (inc, cname, cphone, loc, loc, lat, lon, tri, comp, comp, st, disp_st, amb_id, rec_at, disp_at, arr_at, notes, vitals))
            print(f"  + Added 907 Emergency Call: {inc} [{tri}] - {loc}")

    conn.commit()
    conn.close()
    print(f"EMS Seeding completed successfully for {db_path}!")

if __name__ == "__main__":
    for p in DB_PATHS:
        seed_database(p)
