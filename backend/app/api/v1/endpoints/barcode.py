"""
Barcode & QR Code Scanner and Resolver Endpoints.
Supports Pharmacy medicine traceability, patient wristbands, and cashier invoices.
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.services.barcode_service import (
    barcode_service,
    DRUG_BARCODE_CATALOG,
    PATIENT_QR_CATALOG,
    INVOICE_QR_CATALOG,
)

router = APIRouter()


class BarcodeResolveResponse(BaseModel):
    matched: bool
    entity_type: str
    barcode: str
    label: str
    details: Dict[str, Any]
    action_recommended: str


class BarcodeGenerateRequest(BaseModel):
    entity_type: str = Field(..., description="patient, invoice, medicine, blood_bag")
    entity_id: str = Field(..., description="Unique identifier e.g. MKH-2026-0001 or INV-2026-MKH-0192")


class BarcodeGenerateResponse(BaseModel):
    code_string: str
    entity_type: str
    entity_id: str
    caption: str
    qr_svg_placeholder: str


@router.get("/resolve", response_model=BarcodeResolveResponse, summary="Scan & Resolve Barcode or QR Code")
async def resolve_barcode(
    code: str = Query(..., description="Raw scanned barcode or QR code data string"),
) -> BarcodeResolveResponse:
    """
    Instantly decodes any scanned barcode or QR code string from:
    - Pharmacy medicine packages (GS1 / Code128 / EAN)
    - Patient wristbands & clinic cards (QR code)
    - Cashier billing invoices & Telebirr receipts (QR code)
    - Blood bank transfusion units (Code128)
    """
    res = barcode_service.resolve_code(code)
    return BarcodeResolveResponse(
        matched=res["matched"],
        entity_type=res["entity_type"],
        barcode=res["barcode"],
        label=res["label"],
        details=res["details"],
        action_recommended=res["action_recommended"],
    )


@router.post("/generate", response_model=BarcodeGenerateResponse, summary="Generate Barcode / QR Code Metadata")
async def generate_barcode(payload: BarcodeGenerateRequest) -> BarcodeGenerateResponse:
    """Generate encoded code payload and printable label caption."""
    res = barcode_service.generate_code_payload(payload.entity_type, payload.entity_id)
    return BarcodeGenerateResponse(
        code_string=res["code_string"],
        entity_type=res["entity_type"],
        entity_id=res["entity_id"],
        caption=res["caption"],
        qr_svg_placeholder=res["qr_svg_placeholder"],
    )


@router.get("/presets", summary="Get test hospital barcodes for 1-click scanning")
async def get_test_presets() -> Dict[str, Any]:
    """Retrieve test barcodes to simulate scanning in hardware or browser environments."""
    return {
        "medicines": [
            {"code": "MED-AMX-625", "name": "Amoxicillin + Clavulanic Acid 625mg", "batch": "BAT-2026-A12"},
            {"code": "MED-AML-005", "name": "Amlodipine Besylate 5mg", "batch": "BAT-2026-B08"},
            {"code": "MED-PCM-500", "name": "Paracetamol BP 500mg", "batch": "BAT-2026-P99"},
            {"code": "MED-CTR-1000", "name": "Ceftriaxone Sodium 1g Injection", "batch": "BAT-2026-C44"},
        ],
        "patient_wristbands": [
            {"code": "MKH-PAT:MKH-2026-0001", "name": "Gudeta Hailu Tadesse (MRN: MKH-2026-0001)"},
            {"code": "MKH-PAT:MKH-2026-0042", "name": "Chaltu Daba Tolasa (MRN: MKH-2026-0042)"},
        ],
        "invoices": [
            {"code": "MKH-INV:INV-2026-MKH-0192", "invoice": "INV-2026-MKH-0192", "amount": 84.0},
            {"code": "MKH-INV:INV-2026-MKH-0084", "invoice": "INV-2026-MKH-0084", "amount": 56.0},
        ],
        "blood_units": [
            {"code": "BLD-O-POS-4401", "blood_group": "O+", "component": "PRBC"},
        ],
    }
