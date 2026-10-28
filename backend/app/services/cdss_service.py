"""
Clinical Decision Support System (CDSS) safety evaluation engine.
Detects Drug-Drug Interactions (DDI) and Patient Allergies in real time.
"""
from typing import List, Tuple

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cdss import DrugInteraction, PatientAllergy, SeverityLevel
from app.schemas.cdss import (
    CDSSAllergyWarning,
    CDSSCheckResult,
    CDSSInteractionWarning,
)


async def evaluate_prescription_safety(
    db: AsyncSession,
    patient_id: int,
    drug_names: List[str],
) -> CDSSCheckResult:
    """
    Evaluate prescribed medication list against:
    1. Pairwise Drug-Drug Interactions (DDI)
    2. Documented Patient Allergies
    """
    clean_drugs = [d.strip().lower() for d in drug_names if d.strip()]
    interactions: List[CDSSInteractionWarning] = []
    allergies: List[CDSSAllergyWarning] = []
    has_critical = False

    # 1. Pairwise DDI evaluation
    for i in range(len(clean_drugs)):
        for j in range(i + 1, len(clean_drugs)):
            d1 = clean_drugs[i]
            d2 = clean_drugs[j]

            stmt = select(DrugInteraction).where(
                or_(
                    (DrugInteraction.drug_a_name.ilike(d1) & DrugInteraction.drug_b_name.ilike(d2)),
                    (DrugInteraction.drug_a_name.ilike(d2) & DrugInteraction.drug_b_name.ilike(d1)),
                )
            )
            res = await db.execute(stmt)
            match = res.scalar_one_or_none()

            if match:
                if match.severity in (SeverityLevel.SEVERE, SeverityLevel.CRITICAL):
                    has_critical = True

                interactions.append(
                    CDSSInteractionWarning(
                        drug_a=match.drug_a_name,
                        drug_b=match.drug_b_name,
                        severity=match.severity,
                        clinical_effect=match.clinical_effect,
                        recommendation=match.recommendation,
                    )
                )

    # 2. Patient Allergies check
    allergy_stmt = select(PatientAllergy).where(PatientAllergy.patient_id == patient_id)
    allergy_res = await db.execute(allergy_stmt)
    patient_allergies = list(allergy_res.scalars().all())

    for allergy in patient_allergies:
        substance = allergy.substance.lower()
        for drug in clean_drugs:
            if substance in drug or drug in substance:
                if allergy.severity in (SeverityLevel.SEVERE, SeverityLevel.CRITICAL):
                    has_critical = True

                allergies.append(
                    CDSSAllergyWarning(
                        drug_name=drug.title(),
                        allergen_substance=allergy.substance,
                        reaction=allergy.reaction,
                        severity=allergy.severity,
                    )
                )

    has_warnings = bool(interactions or allergies)

    if has_critical:
        summary = "CRITICAL WARNING: Severe drug interactions or known patient allergies detected! Review carefully before dispensing."
    elif has_warnings:
        summary = "CAUTION: Moderate drug interactions or clinical precautions noted."
    else:
        summary = "No adverse drug interactions or documented allergies found."

    return CDSSCheckResult(
        has_critical_alerts=has_critical,
        has_warnings=has_warnings,
        interactions=interactions,
        allergies=allergies,
        summary_message=summary,
    )
