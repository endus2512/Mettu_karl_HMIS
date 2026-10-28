"""
API v1 main router — aggregates all endpoint sub-routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    academic,
    accounting,
    analytics,
    asset,
    auth,
    barcode,
    billing,
    blood_bank,
    cdss,
    clinical_audit,
    coding,
    crm,
    dietary,
    efda,
    ems,
    fayda,
    fhir,
    health,
    hrm,
    infection_control,
    insurance_claims,
    iomt,
    mci,
    mortuary,
    ot_cssd,
    pacs,
    patient_portal,
    pharmacy,
    power_grid,
    procurement,
    queue,
    sms_gateway,
    telemed,
    waste,
)

api_v1_router = APIRouter()

# Core & Infrastructure
api_v1_router.include_router(health.router, tags=["Health"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(patient_portal.router, prefix="/portal", tags=["Patient Portal"])
api_v1_router.include_router(fhir.router, prefix="/fhir/r4", tags=["FHIR R4"])

# Clinical & Patient Modules
api_v1_router.include_router(billing.router, prefix="/billing", tags=["Billing & Telebirr"])
api_v1_router.include_router(pharmacy.router, prefix="/pharmacy", tags=["Pharmacy & Stock"])
api_v1_router.include_router(coding.router, prefix="/coding", tags=["Medical Coding"])
api_v1_router.include_router(queue.router, prefix="/queue", tags=["Queue & Token System"])
api_v1_router.include_router(cdss.router, prefix="/cdss", tags=["Clinical Decision Support"])
api_v1_router.include_router(telemed.router, prefix="/telemedicine", tags=["Telemedicine"])
api_v1_router.include_router(analytics.router, prefix="/analytics", tags=["Executive BI Analytics"])

# Enterprise ERP & Operational Modules
api_v1_router.include_router(hrm.router, prefix="/hrm", tags=["HRM & Payroll"])
api_v1_router.include_router(asset.router, prefix="/assets", tags=["Biomedical Asset Management"])
api_v1_router.include_router(ot_cssd.router, prefix="/ot", tags=["Operation Theatre & CSSD"])
api_v1_router.include_router(pacs.router, prefix="/pacs", tags=["PACS & RIS Radiology"])
api_v1_router.include_router(accounting.router, prefix="/accounting", tags=["Financial Accounting & GL"])

# Specialized Niche, Academic & IoMT Modules
api_v1_router.include_router(blood_bank.router, prefix="/blood-bank", tags=["Blood Bank Management"])
api_v1_router.include_router(ems.router, prefix="/ems", tags=["Ambulance & Emergency Dispatch"])
api_v1_router.include_router(dietary.router, prefix="/dietary", tags=["Dietary & Kitchen Management"])
api_v1_router.include_router(mortuary.router, prefix="/mortuary", tags=["Mortuary Management"])
api_v1_router.include_router(crm.router, prefix="/crm", tags=["Patient CRM & Grievance Redressal"])
api_v1_router.include_router(academic.router, prefix="/academic", tags=["Research & Academic Training"])
api_v1_router.include_router(waste.router, prefix="/waste", tags=["Medical Waste & Incinerator"])
api_v1_router.include_router(procurement.router, prefix="/procurement", tags=["Supply Chain & Tenders"])
api_v1_router.include_router(iomt.router, prefix="/iomt", tags=["IoMT & Bedside Medical Telemetry"])

# Module 5: National Regulations, Local Integrations & Resilience
api_v1_router.include_router(fayda.router, prefix="/fayda", tags=["National Digital ID (Fayda)"])
api_v1_router.include_router(efda.router, prefix="/efda", tags=["EFDA Pharmacovigilance & Recalls"])
api_v1_router.include_router(mci.router, prefix="/mci", tags=["Mass Casualty Incident (START Triage)"])
api_v1_router.include_router(infection_control.router, prefix="/infection-control", tags=["Infection Control & EPHI"])
api_v1_router.include_router(insurance_claims.router, prefix="/insurance-claims", tags=["CBHI & EHIA Claims Workflow"])
api_v1_router.include_router(clinical_audit.router, prefix="/clinical-audit", tags=["Clinical Audit & EHSTG"])
api_v1_router.include_router(power_grid.router, prefix="/power-grid", tags=["Power Grid & Generator Resilience"])

# Module 6: Telecommunications & Hardware Traceability (SMS/USSD & Barcode/QR)
api_v1_router.include_router(sms_gateway.router, prefix="/sms", tags=["SMS & USSD Gateway (*907#)"])
api_v1_router.include_router(barcode.router, prefix="/barcode", tags=["Barcode & QR Scanner"])
