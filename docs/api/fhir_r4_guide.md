# HL7 FHIR R4 Integration Guide

## 1. Introduction

The Mettu Karl Hospital Information System natively exposes **HL7 FHIR Release 4 (R4)** compliant REST endpoints. This allows seamless integration with:
- National health information exchanges (e.g., Ethiopian Ministry of Health DHIS2)
- Diagnostic laboratory analyzers (HL7 / FHIR)
- Digital imaging and PACS archives
- Regional referral hospital networks

---

## 2. Base Endpoint

All FHIR R4 resources are mounted at:
```
https://his.mettukarl.hospital/api/v1/fhir/r4
```

Authentication is enforced via Bearer JWT tokens in the `Authorization` header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

## 3. Supported FHIR Resources

### 3.1 Patient Resource (`/Patient`)

#### Search Patients (Bundle)
```http
GET /api/v1/fhir/r4/Patient?name=Gudeta&gender=male&_count=20
```

Response is a compliant FHIR `searchset` Bundle:
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "fullUrl": "https://his.mettukarl.hospital/api/v1/fhir/r4/Patient/6b2f4f6e-1d5b-4a5f-9204-c36b8e21950d",
      "resource": {
        "resourceType": "Patient",
        "id": "6b2f4f6e-1d5b-4a5f-9204-c36b8e21950d",
        "active": true,
        "identifier": [
          {
            "use": "official",
            "system": "urn:oid:mettu-karl:mrn",
            "value": "MKH-2026-000101"
          }
        ],
        "name": [
          {
            "use": "official",
            "family": "Hailu",
            "given": ["Gudeta"]
          }
        ],
        "gender": "male",
        "birthDate": "1985-04-12",
        "telecom": [
          {
            "system": "phone",
            "value": "+251911002233",
            "use": "mobile"
          }
        ],
        "address": [
          {
            "use": "home",
            "line": ["Kebele 01, Mettu town"],
            "city": "Mettu",
            "state": "Oromia",
            "country": "ETH"
          }
        ]
      }
    }
  ]
}
```

#### Read Patient by ID
```http
GET /api/v1/fhir/r4/Patient/{fhir_id}
```

#### Register / Create Patient
```http
POST /api/v1/fhir/r4/Patient
Content-Type: application/json

{
  "first_name": "Derartu",
  "last_name": "Tulu",
  "birth_date": "1992-03-21",
  "gender": "female",
  "phone_number": "+251911998877",
  "city": "Mettu",
  "state_province": "Oromia"
}
```
