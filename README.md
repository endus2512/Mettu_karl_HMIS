# Mettu Karl Referral Hospital Information System (HIS)

> A production-grade, HL7 FHIR R4-compliant Hospital Information System designed for **Mettu Karl Referral Hospital**, Oromia, Ethiopia.

---

## 🚀 Implemented Modules

### 🏥 Module 1: Infrastructure, Security, Testing & Tech Stack
- **Architecture**: Hybrid On-Premises & Cloud Disaster Recovery.
- **On-Premises High Availability**: Kubernetes (K8s) StatefulSets (PostgreSQL, MinIO), Deployments (FastAPI, Next.js, Redis), and Horizontal Pod Autoscaling (HPA 2-10 pods).
- **Security & RBAC**: JWT Bearer auth, bcrypt hashing, TOTP Multi-Factor Authentication (MFA), 5-attempt account lockout policy, and dual append-only audit trails.
- **Interoperability**: Native HL7 FHIR Release 4 (R4) Patient resource searchset and read endpoints.
- **Observability**: Prometheus metrics, Sentry integration, and automated Kubernetes health/readiness probes.
- **Disaster Recovery**: Automated AES-256 encrypted backups (`backup.sh`) with cloud sync and restore drills (`restore.sh`) targeting RTO < 1 hour.
- **CI/CD**: GitHub Actions pipeline covering Ruff linting, Pytest test suites (80%+ coverage gate), Docker builds, and Trivy CVE scanning.

### 🩺 Module 2: Core Clinical & Patient Experience Modules
- **Billing & Telebirr Integration**: Domestic mobile payment (Telebirr API checkout, QR/USSD, and webhook reconciliation) and Community-Based Health Insurance (CBHI / Inshuraansii Fayyaa Hawaasaa) co-pay deductions.
- **Pharmacy & Inventory Management**: Expiry tracking, low stock alerts, and strict **FEFO** (First-Expired, First-Out) batch allocation during dispensing.
- **Medical Coding Standards**: Comprehensive ICD-10/11 disease classification search and LOINC lab/radiology coding catalog.
- **Queue Management & Smart Token System**: Live WebSocket token broadcast to Waiting Room TV monitors with Web Speech audio announcement (*"Token A-012, Room 3"*).
- **Clinical Decision Support System (CDSS)**: Real-time Drug-Drug Interaction (DDI) checker and patient allergy cross-reactivity warnings with clinical override audit logs.
- **Telemedicine & Video Consultation**: Peer-to-peer WebRTC encrypted video/audio consultations with synchronized in-call clinical note and prescription entry.
- **Executive BI Analytics**: High-level dashboard for hospital leadership (Bed Occupancy Rate, OPD triage breakdown, Daily revenue by Telebirr vs Cash, and Stock safety metrics).
- **Multi-Language & Localization**: Full tri-lingual interface in **Afaan Oromoo**, **Amharic**, and **English**, along with **Ethiopian Calendar** (Zemene Meskerem / Pagume) support.
- **SMS Notifications & Reminders**: Ethio Telecom SMS gateway client with multi-lingual appointment and token ready alerts.

### 🏢 Module 3: Enterprise ERP & Operational Management
- **HRM & Ethiopian Payroll**: Complete human resources management with 24/7 clinical shift scheduling (**Morning, Afternoon, Night, On-Call**), daily clock-in attendance, and progressive payroll calculation complying with **Ethiopian Proclamation No. 979/2016** (7% employee pension, 11% employer pension, progressive income tax brackets).
- **Biomedical Equipment & Asset Management**: Hospital medical device registry (Ventilators, Anesthesia, Ultrasound, Autoclaves), location tracking (Building, Ward, Room), Preventive Maintenance (PPM) calibration countdowns, and engineering breakdown work orders.
- **Operation Theatre (OT) & CSSD Sterilization**: Surgical suite table coordination with automatic collision prevention, surgical team roster assignment (Surgeon, Anesthesiologist, Scrub Nurse), and CSSD autoclave batch tracking with 30-day instrument pack sterility lifecycles.
- **PACS / RIS Radiology Integration**: Complete diagnostic imaging management (CR/DX X-Ray, CT Scan, MRI, Ultrasound), MinIO S3 object storage for lossless DICOM instances, and an integrated Web DICOM image viewer with window leveling, contrast inversion, and zoom controls.
- **Full Financial Accounting & General Ledger**: Complete double-entry bookkeeping ($\sum \text{Debit} == \sum \text{Credit}$), standard 4-digit hospital Chart of Accounts (COA: 1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Revenue, 5000s Expenses), Journal Vouchers, and real-time Trial Balance generation.

### 🧪 Module 4: Specialized Niche, Academic & IoMT Modules
- **Blood Bank Management**: Complete ABO & Rh(D) inventory tracking ($A^\pm, B^\pm, AB^\pm, O^\pm$), component shelf-life monitoring (Platelets 5d, PRBC 35-42d, FFP 1yr at $-25^\circ\text{C}$), cold chain refrigerator telemetry ($2^\circ\text{C} - 6^\circ\text{C}$), critical emergency reserve shortage alarms, and automated major/minor serological crossmatching.
- **Ambulance & Emergency Dispatch (EMS)**: Toll-free 907 emergency hotline intake console, 4-tier disaster triage (**RED / Resuscitation, YELLOW / Delayed, GREEN / Minor, BLACK / Expectant**), ambulance fleet management (ALS/BLS/Neonatal), and live dispatch coordination.
- **Dietary & Kitchen Management**: Inpatient therapeutic diet orders (Diabetic low GI, Renal low potassium/sodium, High-Protein post-partum, NPO fasting safeguard for surgeries), kitchen prep queues, and ward cart bedside delivery verification.
- **Mortuary Management**: Cold body vault allocation ($2^\circ\text{C} - 4^\circ\text{C}$ chambers), deceased intake records, official Cause of Death / Death Certificate generation, autopsy tracking, and legal release sign-off to next-of-kin.
- **Patient CRM & Grievance Redressal**: 5-star CSAT patient satisfaction ratings, grievance ticketing with automated strict SLA deadlines (**Critical 4h, High 24h, Medium 72h, Low 7d**), root cause investigation, and departmental corrective action documentation.
- **Research, Clinical Trials & Academic Management**: Institutional Review Board (IRB) ethical clinical trial protocol approvals, participant target vs enrollment tracking, and medical intern/resident procedure logbook with Attending Physician clinical sign-off.
- **Medical Waste Management & Environmental Safety**: WHO 4-color hazardous waste segregation (**Yellow: Infectious, Red: Sharps, Brown: Pharmaceutical/Cytotoxic, Black: Municipal**), collection tracking, and dual-chamber high-temperature incinerator batch logging ($850^\circ\text{C}$ Primary, $1100^\circ\text{C}$ Secondary) with emission scrubber verification.
- **Advanced Supply Chain & Procurement / Tender Management**: Competitive public tender notices, supplier bid submissions, committee technical scoring, and legally binding Purchase Order (PO) issuance.
- **IoMT & Medical Device Telemetry**: Continuous real-time bedside monitor vital streams (Heart Rate, SpO2, NIBP, Respiratory Rate, Temperature) via WebSockets and REST, automated clinical threshold alerts (**Critical Hypoxia SpO2 < 90%, Severe Tachycardia HR > 130 BPM**), and ICU Central Nurse Station acknowledgment workflows.

### 🇪🇹 Module 5: National Regulations, Local Integrations & Resilience
- **National Digital ID Integration (Fayda / FIN)**: Resident eKYC verification via the Ethiopian National ID Program (NIDP), duplicate prevention, and automated linkage to FHIR R4 Patient identifier (`http://fayda.et/fin`).
- **EFDA Compliance & Drug Safety Reporting**: Ethiopian Food and Drug Authority (EFDA) Adverse Drug Reaction (ADR Yellow Form) pharmacovigilance submission and substandard medicine recall broadcast with automatic pharmacy quarantine enforcement.
- **Mass Casualty Incident (MCI) & START Disaster Triage**: Rapid disaster intake protocol (**RED / Immediate, YELLOW / Delayed, GREEN / Minor, BLACK / Expectant**), automated START physiological decision engine, trauma bay bed allocation, and incident command stand-down workflow.
- **Infection Control & EPHI Surveillance**: Hospital-Acquired Infections (HAI) surveillance (SSI, CAUTI, CLABSI, VAP) with isolation safeguards, and Public Health Emergency Management (PHEM) epidemic case alerts (Cholera, Measles, Malaria clusters) transmitted to the Ethiopian Public Health Institute.
- **CBHI & EHIA Insurance Claims Workflow**: Monthly Community-Based Health Insurance (CBHI) batch claim generation by Woreda health pool, encounter line-item adjudication (Approved/Rejected), co-pay audits, and reimbursement reconciliation.
- **Clinical Audit & EHSTG Accreditation**: Quality governance audits complying with Ethiopian Hospital Services Transformation Guidelines (EHSTG / EHHS), percentage compliance tracking by chapter, and Corrective and Preventive Action (CAPA) resolution tracking.
- **Power & Generator / Solar Grid Resilience Monitoring**: Triple-source power telemetry covering the 33kV EEU main grid, dual Cummins 500kVA diesel generators (fuel reserve %, ATS switchover events), and a 100kW rooftop solar PV microgrid with lithium battery State of Charge (SOC %) for uninterrupted ICU, OT, and cold chain protection.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | FastAPI 0.110+ (Async Python 3.11), Uvicorn |
| **Database** | PostgreSQL 15 (asyncpg, SQLAlchemy 2.0 Async ORM, Alembic) |
| **Caching & Pub/Sub** | Redis 7 (hiredis, WebSockets) |
| **Object Storage** | MinIO (S3-compatible, for DICOM/X-rays and lab PDFs) |
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, PWA |
| **Interoperability** | HL7 FHIR Release 4 (R4), ICD-10, LOINC, DICOM, Fayda eKYC |
| **Payment Gateway** | Ethio Telecom Telebirr API + CBHI Electronic Claims |
| **Real-time & Video** | WebSockets + WebRTC P2P |
| **IoMT Telemetry** | Bedside Monitor Streaming (`/ws/{device_uid}`) & Automated Clinical Alarms |
| **National Regulations** | Fayda FIN, EFDA Pharmacovigilance, EPHI PHEM, EHSTG Accreditation |
| **Facility Resilience** | EEU Grid, Dual Cummins 500kVA ATS, Solar PV Microgrid Telemetry |
| **Container & K8s** | Docker, Docker Compose, Kubernetes Manifests (StatefulSet, HPA, Ingress) |

---

## 🏁 Quick Start & Local Development

### 1. Start all infrastructure with Docker Compose
```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
```

### 2. Seed Development Database
Populates staff accounts (Doctor, Nurse, Admin, Pharmacist, Lab Tech), patients, pharmacy formulary, ICD-10 codes, queue departments, biomedical assets, operating rooms, CSSD sterile packs, Chart of Accounts, Blood Bank units, EMS ambulances, IoMT bedside monitors, Fayda records, and CBHI claims:
```bash
python3 scripts/seed_dev.py
```

### 3. Run Backend Automated Tests
```bash
cd backend
pytest tests/ -v
```

### 4. Access the Application Workstations
- **Frontend Web & Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Swagger Documentation**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **Waiting Room Live TV Token Screen**: [http://localhost:3000/queue](http://localhost:3000/queue)
- **HRM & Ethiopian Payroll Workstation**: [http://localhost:3000/hrm](http://localhost:3000/hrm)
- **Biomedical Assets & PPM Tracker**: [http://localhost:3000/assets](http://localhost:3000/assets)
- **Operation Theatre (OT) & CSSD Hub**: [http://localhost:3000/ot](http://localhost:3000/ot)
- **PACS & RIS DICOM Viewer**: [http://localhost:3000/pacs](http://localhost:3000/pacs)
- **General Ledger & Financial Accounting**: [http://localhost:3000/accounting](http://localhost:3000/accounting)
- **Blood Bank & Crossmatch Hub**: [http://localhost:3000/blood-bank](http://localhost:3000/blood-bank)
- **EMS 907 Ambulance Dispatch**: [http://localhost:3000/ems](http://localhost:3000/ems)
- **IoMT Bedside Vitals Stream**: [http://localhost:3000/iomt](http://localhost:3000/iomt)
- **Inpatient Dietary & Nutrition**: [http://localhost:3000/dietary](http://localhost:3000/dietary)
- **Mortuary & Body Vaults**: [http://localhost:3000/mortuary](http://localhost:3000/mortuary)
- **Patient CRM & Grievance SLA**: [http://localhost:3000/crm](http://localhost:3000/crm)
- **IRB Clinical Trials & Academic Logbooks**: [http://localhost:3000/academic](http://localhost:3000/academic)
- **Medical Waste & Incinerator**: [http://localhost:3000/waste](http://localhost:3000/waste)
- **Public Tenders & Procurement**: [http://localhost:3000/procurement](http://localhost:3000/procurement)
- **National Fayda Digital ID**: [http://localhost:3000/fayda](http://localhost:3000/fayda)
- **EFDA Pharmacovigilance (ADR)**: [http://localhost:3000/efda](http://localhost:3000/efda)
- **MCI Disaster & START Triage**: [http://localhost:3000/mci](http://localhost:3000/mci)
- **Infection Control & EPHI**: [http://localhost:3000/infection](http://localhost:3000/infection)
- **CBHI & EHIA Claims Adjudication**: [http://localhost:3000/insurance](http://localhost:3000/insurance)
- **Clinical Audit & EHSTG**: [http://localhost:3000/audit](http://localhost:3000/audit)
- **Power Grid, Generator & Solar**: [http://localhost:3000/power](http://localhost:3000/power)
- **Executive BI Dashboard**: [http://localhost:3000/analytics](http://localhost:3000/analytics)
- **MinIO Object Console**: [http://localhost:9001](http://localhost:9001)
