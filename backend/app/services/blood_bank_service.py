"""
Blood Bank inventory, component shelf life, and crossmatching service.
Mettu Karl Comprehensive Specialized Hospital — Clinical Hemovigilance Service.
"""
from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.blood_bank import (
    BloodDonor,
    BloodGroup,
    BloodUnit,
    BloodUnitStatus,
    ComponentType,
    CrossMatch,
)
from app.models.patient import Patient
from app.models.user import User
from app.schemas.blood_bank import BloodGroupStock


def to_symbol(g: str) -> str:
    """Normalize blood group enum or string to symbol (e.g., 'O_POS' -> 'O+')."""
    if not g:
        return "O+"
    g_clean = str(g).strip().upper()
    mapping = {
        "O_POS": "O+", "O+": "O+", "O_POSITIVE": "O+",
        "O_NEG": "O-", "O-": "O-", "O_NEGATIVE": "O-",
        "A_POS": "A+", "A+": "A+", "A_POSITIVE": "A+",
        "A_NEG": "A-", "A-": "A-", "A_NEGATIVE": "A-",
        "B_POS": "B+", "B+": "B+", "B_POSITIVE": "B+",
        "B_NEG": "B-", "B-": "B-", "B_NEGATIVE": "B-",
        "AB_POS": "AB+", "AB+": "AB+", "AB_POSITIVE": "AB+",
        "AB_NEG": "AB-", "AB-": "AB-", "AB_NEGATIVE": "AB-",
    }
    return mapping.get(g_clean, g_clean)


def to_enum_code(g: str) -> str:
    """Normalize blood group to enum code string (e.g. 'O+' -> 'O_POS')."""
    s = to_symbol(g)
    mapping = {
        "O+": "O_POS", "O-": "O_NEG",
        "A+": "A_POS", "A-": "A_NEG",
        "B+": "B_POS", "B-": "B_NEG",
        "AB+": "AB_POS", "AB-": "AB_NEG",
    }
    return mapping.get(s, "O_POS")


def check_rbc_compatibility(donor_group: str, recipient_group: str) -> Tuple[bool, str]:
    """
    Standard International Society of Blood Transfusion (ISBT) red blood cell compatibility rules.
    """
    d = to_symbol(donor_group)
    r = to_symbol(recipient_group)

    # Universal PRBC Donor: O-
    if d == "O-":
        return True, "COMPATIBLE: O-Negative is the universal red blood cell donor."

    # Identical match
    if d == r:
        return True, f"COMPATIBLE: Identical ABO/Rh group match ({d})."

    # Universal PRBC Recipient: AB+
    if r == "AB+":
        return True, f"COMPATIBLE: AB-Positive is the universal recipient (received {d})."

    # Rh-negative to Rh-positive of matching ABO group:
    if d == "A-" and r in ("A+", "AB+"):
        return True, f"COMPATIBLE: Rh-negative donor ({d}) to Rh-positive recipient ({r})."
    if d == "B-" and r in ("B+", "AB+"):
        return True, f"COMPATIBLE: Rh-negative donor ({d}) to Rh-positive recipient ({r})."
    if d == "O+" and r in ("A+", "B+", "AB+"):
        return True, f"COMPATIBLE: O-Positive red cells compatible with Rh-positive recipient ({r})."
    if d == "A+" and r == "AB+":
        return True, "COMPATIBLE: A-Positive red cells compatible with AB-Positive recipient."
    if d == "B+" and r == "AB+":
        return True, "COMPATIBLE: B-Positive red cells compatible with AB-Positive recipient."
    if d == "AB-" and r == "AB+":
        return True, "COMPATIBLE: AB-Negative red cells compatible with AB-Positive recipient."

    return False, f"INCOMPATIBLE: Transfusion of {d} into recipient {r} will trigger acute hemolytic reaction!"


async def get_blood_bank_stock_summary(db: AsyncSession) -> List[BloodGroupStock]:
    """Calculate real-time unexpired blood unit counts across all 8 ABO/Rh blood groups."""
    now = datetime.now(timezone.utc)
    summary: List[BloodGroupStock] = []

    for bg in BloodGroup:
        # Check by enum value and enum name to handle any storage representation
        stmt = select(BloodUnit).where(
            or_(BloodUnit.blood_group == bg, BloodUnit.blood_group == bg.name),
            BloodUnit.status == BloodUnitStatus.AVAILABLE,
            BloodUnit.expiry_date > now,
        )
        res = await db.execute(stmt)
        units = list(res.scalars().all())

        prbc = sum(1 for u in units if u.component_type in (ComponentType.PACKED_RBC, ComponentType.WHOLE_BLOOD))
        plasma = sum(1 for u in units if u.component_type == ComponentType.FRESH_FROZEN_PLASMA)
        platelets = sum(1 for u in units if u.component_type == ComponentType.PLATELETS)
        total = len(units)

        # Critical shortage threshold
        min_thresh = 5 if bg == BloodGroup.O_NEG else 3
        is_short = total < min_thresh

        summary.append(
            BloodGroupStock(
                blood_group=bg.name,  # "O_POS", "O_NEG", "A_POS" etc. matching tests and UI
                units_available=total,
                total_units=total,
                prbc_units=prbc,
                plasma_units=plasma,
                platelet_units=platelets,
                is_critical_shortage=is_short,
                min_threshold=min_thresh,
            )
        )

    return summary


async def perform_crossmatch(
    db: AsyncSession,
    patient_id: int,
    blood_unit_id: int,
    patient_blood_group: Optional[str] = None,
    crossmatch_method: str = "Indirect Antiglobulin Test (IAT)",
    is_compatible: Optional[bool] = None,
    technologist_id: int = 1,
    notes: Optional[str] = None,
) -> CrossMatch:
    """Record serological crossmatch compatibility between patient and donor unit."""
    # 1. Fetch Blood Unit
    unit_res = await db.execute(select(BloodUnit).where(BloodUnit.id == blood_unit_id))
    unit = unit_res.scalar_one_or_none()
    if not unit:
        raise ValueError(f"Blood unit #{blood_unit_id} not found in inventory")

    # 2. Derive compatibility if not explicitly set
    donor_group_str = unit.blood_group.name if hasattr(unit.blood_group, "name") else str(unit.blood_group)
    recip_group_str = patient_blood_group or "A_POS"

    if is_compatible is None:
        computed_comp, verdict_text = check_rbc_compatibility(donor_group_str, recip_group_str)
        is_compatible = computed_comp
        if not notes:
            notes = verdict_text

    crossmatch_code = f"XM-{uuid.uuid4().hex[:8].upper()}"
    status_str = "compatible" if is_compatible else "incompatible"

    cm = CrossMatch(
        crossmatch_code=crossmatch_code,
        patient_id=patient_id,
        blood_unit_id=blood_unit_id,
        patient_blood_group=to_symbol(recip_group_str),
        is_compatible=is_compatible,
        crossmatch_method=crossmatch_method,
        status=status_str,
        technologist_id=technologist_id,
        notes=notes,
    )
    db.add(cm)

    # If compatible and available, reserve the blood unit
    if is_compatible and unit.status == BloodUnitStatus.AVAILABLE:
        unit.status = BloodUnitStatus.RESERVED

    await db.commit()
    await db.refresh(cm)
    return cm
