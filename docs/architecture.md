# Mettu Karl Referral Hospital - System Architecture

## 1. High-Level Architecture Overview

The Mettu Karl Hospital Information System (HIS) is designed with a **Hybrid On-Premises & Cloud Architecture**:

- **On-Premises Core (Primary Operations)**:
  - Ensures continuous clinical operations (OPD, IPD, Triage, Surgery, Pharmacy, Lab) even during total internet connectivity cuts.
  - Hosts the Next.js PWA frontend, FastAPI backend services, primary PostgreSQL database cluster, Redis caching/session pool, and MinIO medical object storage (DICOM/X-ray).
  - Orchestrated on-premises with Kubernetes (K8s) for automatic failover, pod healing, and Horizontal Pod Autoscaling (HPA).

- **Cloud Layer (Disaster Recovery & Offsite Backup)**:
  - Continuous encrypted WAL/snapshot backup mirror in object storage (AWS S3 or secondary data center).
  - Offsite error tracking (Sentry) and external synthetic health monitoring.

---

## 2. Component Topology

```
                       [ Internal Hospital Network / Wi-Fi ]
                                        │
                           [ NGINX Ingress Controller ]
                           (TLS Termination & Routing)
                                  │            │
            ┌─────────────────────┘            └─────────────────────┐
            ▼                                                        ▼
  [ Next.js Frontend ]                                      [ FastAPI Backend ]
  (Responsive PWA)                                         (Async REST & FHIR R4)
            │                                                        │
            │ (API Requests / JWT Bearer)                            ├── [ Redis 7 ] (Sessions, Lockout)
            └───────────────────────────────────────────────────────┼── [ PostgreSQL 15 ] (Primary DB)
                                                                     ├── [ MinIO ] (X-rays, PDFs)
                                                                     └── [ Prometheus ] (Metrics)
```

---

## 3. Security Architecture

1. **Authentication & Authorization**:
   - Short-lived JSON Web Tokens (JWT) signed with HS256/RS256.
   - Time-based One-Time Password (TOTP) Multi-Factor Authentication (MFA).
   - Strict Role-Based Access Control (RBAC): `doctor`, `nurse`, `lab_tech`, `pharmacist`, `receptionist`, `admin`.
   - Account lockout policy: 5 consecutive failed attempts locks the account for 15 minutes.

2. **Audit Trails & Compliance**:
   - Dual-persistence audit logging:
     - Relational `audit_logs` table for fast querying and filtering.
     - Append-only encrypted log file for forensic integrity.
   - Every patient record access, modification, and login event is stamped with user ID, action, resource, timestamp, and IP address.

3. **Data Protection**:
   - At-Rest: PostgreSQL data volume encryption + MinIO server-side encryption.
   - In-Transit: Enforced TLS 1.3 across all HTTP endpoints.

---

## 4. Disaster Recovery & Availability

| Metric | Target |
|---|---|
| **RTO (Recovery Time Objective)** | < 1 hour (on-site database restore) / < 4 hours (full cluster rebuild) |
| **RPO (Recovery Point Objective)** | ≤ 15 minutes |
| **Backup Encryption** | AES-256-CBC with SHA256 integrity checksums |
| **Autoscaling** | K8s Horizontal Pod Autoscaler (2–10 backend replicas based on CPU utilization) |
