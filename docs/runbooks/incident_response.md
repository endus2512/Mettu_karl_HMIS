# Runbook: Incident Response & Break-Glass Access

## 1. Severity Classifications

| Severity | Definition | Target Resolution | Examples |
|---|---|---|---|
| **P1 - Critical** | Total system outage or patient data compromise | < 30 minutes | Database down, clinical staff unable to access records |
| **P2 - Major** | Core module unavailable (e.g. Pharmacy or Lab) | < 2 hours | Prescription dispatch failing, FHIR endpoint returning 500s |
| **P3 - Moderate** | Performance degradation, non-blocking bug | < 24 hours | Search response latency > 3s, slow image preview |
| **P4 - Low** | Minor cosmetic UI issue, non-urgent feature query | Next sprint | Dashboard styling misalignment |

---

## 2. Emergency "Break-Glass" Access Protocol

In life-threatening clinical emergencies where standard RBAC permissions or network authentication blocks urgent treatment:

1. **Triggering Break-Glass Access**:
   - The attending physician or nurse supervisor accesses the emergency override portal.
   - The system demands a mandatory free-text justification (e.g., *"Emergency polytrauma patient unconscious, immediate access to surgical allergy history required"*).
2. **Immediate System Actions**:
   - The user is temporarily granted read/write access to the specific patient's record.
   - An instant **P1 notification** is dispatched to the Chief Medical Officer (CMO) and System Administrator via SMS and email.
   - A dedicated `EMERGENCY_OVERRIDE` event is permanently recorded in both `audit_logs` and the immutable log file.
3. **Post-Incident Review**:
   - Within 24 hours, the Clinical Ethics and Quality Assurance committee must review the justification.

---

## 3. Incident Escalation Contacts

- **Hospital IT Operations Desk**: Extension 1102 / it-support@mettukarl.gov.et
- **Database Administrator (DBA)**: +251 91 100 0001
- **Hospital Clinical Lead**: +251 91 100 0002
- **Lead Software Engineer**: +251 91 100 0003
