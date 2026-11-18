"""
Barcode & QR Code Scanner and Resolver Endpoints.
Supports Pharmacy medicine traceability, patient wristbands, cashier invoices,
real ISO/IEC 18004 QR SVG generation, and Zebra ZPL thermal label output.
"""
from typing import Annotated, Any, Dict

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_staff
from app.core.database import get_db
from app.models.user import User
from app.services.barcode_service import barcode_service

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
    qr_svg: str
    qr_data_uri: str
    qr_svg_placeholder: str
    zpl_label: str
    generated_at: str


@router.get("/resolve", response_model=BarcodeResolveResponse, summary="Scan & Resolve Barcode or QR Code")
async def resolve_barcode(
    current_user: Annotated[User, Depends(require_staff)],
    db: Annotated[AsyncSession, Depends(get_db)],
    code: str = Query(..., description="Raw scanned barcode or QR code data string"),
) -> BarcodeResolveResponse:
    """
    Instantly decodes any scanned barcode or QR code string from live DB records or hospital catalogs:
    - Pharmacy medicine packages (GS1 / Code128 / EAN)
    - Patient wristbands & clinic cards (QR code)
    - Cashier billing invoices & Telebirr receipts (QR code)
    - Blood bank transfusion units (Code128)
    """
    res = await barcode_service.resolve_code_with_db(db, code)
    return BarcodeResolveResponse(
        matched=res["matched"],
        entity_type=res["entity_type"],
        barcode=res["barcode"],
        label=res["label"],
        details=res["details"],
        action_recommended=res["action_recommended"],
    )


@router.post("/generate", response_model=BarcodeGenerateResponse, summary="Generate Real Scannable QR Code & ZPL Label")
async def generate_barcode(
    payload: BarcodeGenerateRequest,
    current_user: Annotated[User, Depends(require_staff)],
) -> BarcodeGenerateResponse:
    """Generate real ISO/IEC 18004 QR SVG, Base64 Data URI, and Zebra ZPL thermal print payload."""
    res = barcode_service.generate_code_payload(payload.entity_type, payload.entity_id)
    return BarcodeGenerateResponse(
        code_string=res["code_string"],
        entity_type=res["entity_type"],
        entity_id=res["entity_id"],
        caption=res["caption"],
        qr_svg=res["qr_svg"],
        qr_data_uri=res["qr_data_uri"],
        qr_svg_placeholder=res["qr_svg_placeholder"],
        zpl_label=res["zpl_label"],
        generated_at=res["generated_at"],
    )


@router.get("/qr.svg", summary="Render Raw Scannable QR Code SVG")
async def get_qr_svg(
    current_user: Annotated[User, Depends(require_staff)],
    code: str = Query(..., min_length=1, max_length=256, description="Code payload to encode into QR SVG"),
) -> Response:
    """Return a crisp, scannable ISO/IEC 18004 vector QR code SVG."""
    svg_markup = barcode_service.render_qr_svg(code.strip())
    safe_name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in code.strip())[:60]
    return Response(
        content=svg_markup,
        media_type="image/svg+xml; charset=utf-8",
        headers={
            "Content-Disposition": f'inline; filename="qr-{safe_name}.svg"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/presets", summary="Get test hospital barcodes for 1-click scanning")
async def get_test_presets(
    current_user: Annotated[User, Depends(require_staff)],
) -> Dict[str, Any]:
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
