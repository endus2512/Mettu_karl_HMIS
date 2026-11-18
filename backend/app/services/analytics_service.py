"""
Executive Business Intelligence and Analytics service.
Aggregates live clinical workload, ward bed occupancy, surgeries, laboratory throughput,
infection surveillance, and revenue streams directly from the hospital database.
"""
import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import Invoice, Payment, PaymentMethod, PaymentStatus
from app.models.infection_control import HAIType, HospitalAcquiredInfectionLog
from app.models.inpatient import InpatientAdmission, Ward, WardBed
from app.models.laboratory import LabOrder, LabOrderStatus
from app.models.ot_cssd import SurgicalBooking, SurgeryStatus
from app.models.patient import Patient
from app.models.queue import QueueDepartment, QueueTicket
from app.schemas.analytics import (
    DepartmentWorkload,
    ExecutiveSummaryResponse,
    RevenueMetric,
    WardOccupancyMetric,
)
from app.services.pharmacy_service import check_inventory_alerts

TimeRangeType = Literal["today", "week", "month", "quarter"]


def _resolve_period_bounds(time_range: str) -> tuple[datetime, datetime, datetime]:
    """Return (period_start, prev_period_start, now) in UTC for the requested time_range."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if time_range == "today":
        period_start = today_start
        prev_start = today_start - timedelta(days=1)
    elif time_range == "week":
        period_start = today_start - timedelta(days=6)
        prev_start = period_start - timedelta(days=7)
    elif time_range == "quarter":
        period_start = today_start - timedelta(days=89)
        prev_start = period_start - timedelta(days=90)
    else:
        # Default "month" (rolling 30 days including today)
        period_start = today_start - timedelta(days=29)
        prev_start = period_start - timedelta(days=30)

    return period_start, prev_start, now


async def get_executive_summary(
    db: AsyncSession,
    time_range: str = "month",
) -> ExecutiveSummaryResponse:
    """Compute live hospital operational & EHSTG/MoH KPIs from the database."""
    normalized_range = time_range if time_range in ("today", "week", "month", "quarter") else "month"
    period_start, prev_start, now = _resolve_period_bounds(normalized_range)

    # 1. Total Patients Registered + Period Growth
    total_patients = int((await db.execute(select(func.count(Patient.id)))).scalar_one() or 0)
    new_patients_period = int(
        (
            await db.execute(
                select(func.count(Patient.id)).where(Patient.created_at >= period_start)
            )
        ).scalar_one()
        or 0
    )
    prev_patients_period = int(
        (
            await db.execute(
                select(func.count(Patient.id)).where(
                    Patient.created_at >= prev_start,
                    Patient.created_at < period_start,
                )
            )
        ).scalar_one()
        or 0
    )
    if prev_patients_period > 0:
        patient_growth_pct = round(
            ((new_patients_period - prev_patients_period) / prev_patients_period) * 100.0, 1
        )
    elif new_patients_period > 0:
        patient_growth_pct = 100.0
    else:
        patient_growth_pct = 0.0

    # 2. Outpatients in Period (from Queue Tickets)
    outpatients_count = int(
        (
            await db.execute(
                select(func.count(QueueTicket.id)).where(QueueTicket.created_at >= period_start)
            )
        ).scalar_one()
        or 0
    )

    # 3. Revenue Collections in Period
    gross_rev = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
                    Payment.status == PaymentStatus.SUCCESS,
                    Payment.created_at >= period_start,
                )
            )
        ).scalar_one()
        or 0.0
    )
    telebirr_rev = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
                    Payment.payment_method == PaymentMethod.TELEBIRR,
                    Payment.status == PaymentStatus.SUCCESS,
                    Payment.created_at >= period_start,
                )
            )
        ).scalar_one()
        or 0.0
    )
    cash_rev = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
                    Payment.payment_method == PaymentMethod.CASH,
                    Payment.status == PaymentStatus.SUCCESS,
                    Payment.created_at >= period_start,
                )
            )
        ).scalar_one()
        or 0.0
    )
    cbhi_claims = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Invoice.insurance_covered_amount), 0.0)).where(
                    Invoice.created_at >= period_start
                )
            )
        ).scalar_one()
        or 0.0
    )

    total_combined_rev = telebirr_rev + cash_rev + cbhi_claims
    rev_denom = total_combined_rev if total_combined_rev > 0 else 1.0
    breakdown = [
        RevenueMetric(
            category="Telebirr",
            total_birr=round(telebirr_rev, 2),
            percentage=round((telebirr_rev / rev_denom) * 100, 1) if total_combined_rev > 0 else 0.0,
        ),
        RevenueMetric(
            category="Cash",
            total_birr=round(cash_rev, 2),
            percentage=round((cash_rev / rev_denom) * 100, 1) if total_combined_rev > 0 else 0.0,
        ),
        RevenueMetric(
            category="CBHI Claims",
            total_birr=round(cbhi_claims, 2),
            percentage=round((cbhi_claims / rev_denom) * 100, 1) if total_combined_rev > 0 else 0.0,
        ),
    ]

    # 4. Department Workload Distribution (Queue Tickets in Period)
    dept_stmt = (
        select(QueueDepartment.name, func.count(QueueTicket.id))
        .join(QueueTicket, QueueTicket.department_id == QueueDepartment.id)
        .where(QueueTicket.created_at >= period_start)
        .group_by(QueueDepartment.name)
        .order_by(func.count(QueueTicket.id).desc())
    )
    dept_res = await db.execute(dept_stmt)
    workload = [
        DepartmentWorkload(department=name, patient_count=int(count))
        for name, count in dept_res.all()
    ]

    # 5. Live Ward & Bed Occupancy (from Ward & WardBed tables — ZERO hardcoded mock beds)
    wards_res = await db.execute(select(Ward).where(Ward.is_active == True).order_by(Ward.ward_code))  # noqa: E712
    wards = wards_res.scalars().all()
    beds_res = await db.execute(select(WardBed))
    all_beds = beds_res.scalars().all()

    beds_by_ward: dict[int, list[WardBed]] = {}
    for bed in all_beds:
        beds_by_ward.setdefault(bed.ward_id, []).append(bed)

    total_beds = len(all_beds)
    occupied_beds = sum(1 for b in all_beds if str(b.status).lower() == "occupied")
    available_beds = sum(1 for b in all_beds if str(b.status).lower() == "available")

    active_admissions = int(
        (
            await db.execute(
                select(func.count(InpatientAdmission.id)).where(
                    InpatientAdmission.status == "admitted"
                )
            )
        ).scalar_one()
        or 0
    )
    effective_occupied = max(occupied_beds, active_admissions) if total_beds > 0 else active_admissions
    if total_beds > 0:
        effective_occupied = min(effective_occupied, total_beds)
        bor = round((effective_occupied / total_beds) * 100.0, 1)
    else:
        bor = 0.0

    ward_breakdown: list[WardOccupancyMetric] = []
    for ward in wards:
        w_beds = beds_by_ward.get(ward.id, [])
        w_total = len(w_beds)
        w_occ = sum(1 for b in w_beds if str(b.status).lower() == "occupied")
        w_pct = round((w_occ / w_total) * 100.0, 1) if w_total > 0 else 0.0
        ward_breakdown.append(
            WardOccupancyMetric(
                ward_code=ward.ward_code,
                ward_name=ward.name_en,
                total_beds=w_total,
                occupied_beds=w_occ,
                occupancy_percent=w_pct,
            )
        )

    # 6. Emergency Admissions, ALOS & Bed Turnover Rate
    emergency_admissions = int(
        (
            await db.execute(
                select(func.count(InpatientAdmission.id)).where(
                    InpatientAdmission.admission_date >= period_start,
                    InpatientAdmission.admission_type == "emergency",
                )
            )
        ).scalar_one()
        or 0
    )

    discharged_res = await db.execute(
        select(
            InpatientAdmission.admission_date,
            InpatientAdmission.discharge_date,
            InpatientAdmission.total_days,
        ).where(
            InpatientAdmission.status.in_(["discharged", "deceased"]),
            InpatientAdmission.discharge_date >= period_start,
        )
    )
    discharged_rows = discharged_res.all()
    stay_days: list[float] = []
    for adm_dt, dis_dt, total_d in discharged_rows:
        if total_d and total_d > 0:
            stay_days.append(float(total_d))
        elif adm_dt and dis_dt:
            delta_days = max((dis_dt - adm_dt).total_seconds() / 86400.0, 0.5)
            stay_days.append(delta_days)
    alos_days = round(sum(stay_days) / len(stay_days), 1) if stay_days else 0.0

    bed_turnover = round(len(discharged_rows) / total_beds, 2) if total_beds > 0 else 0.0

    # 7. Operating Theater (OT) Surgeries in Period
    ot_total = int(
        (
            await db.execute(
                select(func.count(SurgicalBooking.id)).where(
                    SurgicalBooking.scheduled_start >= period_start
                )
            )
        ).scalar_one()
        or 0
    )
    ot_completed = int(
        (
            await db.execute(
                select(func.count(SurgicalBooking.id)).where(
                    SurgicalBooking.scheduled_start >= period_start,
                    SurgicalBooking.status == SurgeryStatus.COMPLETED,
                )
            )
        ).scalar_one()
        or 0
    )
    ot_checklist_verified = int(
        (
            await db.execute(
                select(func.count(SurgicalBooking.id)).where(
                    SurgicalBooking.scheduled_start >= period_start,
                    SurgicalBooking.who_safety_checklist_verified == True,  # noqa: E712
                )
            )
        ).scalar_one()
        or 0
    )

    # 8. Laboratory Orders in Period
    lab_total = int(
        (
            await db.execute(
                select(func.count(LabOrder.id)).where(LabOrder.ordered_at >= period_start)
            )
        ).scalar_one()
        or 0
    )
    lab_completed = int(
        (
            await db.execute(
                select(func.count(LabOrder.id)).where(
                    LabOrder.ordered_at >= period_start,
                    LabOrder.status == LabOrderStatus.COMPLETED,
                )
            )
        ).scalar_one()
        or 0
    )

    # 9. Infection Control (HAI & SSI Rate)
    hai_total = int(
        (
            await db.execute(
                select(func.count(HospitalAcquiredInfectionLog.id)).where(
                    HospitalAcquiredInfectionLog.created_at >= period_start
                )
            )
        ).scalar_one()
        or 0
    )
    ssi_count = int(
        (
            await db.execute(
                select(func.count(HospitalAcquiredInfectionLog.id)).where(
                    HospitalAcquiredInfectionLog.created_at >= period_start,
                    HospitalAcquiredInfectionLog.hai_type == HAIType.SURGICAL_SITE_INFECTION,
                )
            )
        ).scalar_one()
        or 0
    )
    ssi_denom = ot_completed if ot_completed > 0 else ot_total
    ssi_rate_pct = round((ssi_count / ssi_denom) * 100.0, 2) if ssi_denom > 0 else 0.0

    # 10. Pharmacy Stock Alerts
    stock_alerts = await check_inventory_alerts(db)
    low_stock_count = sum(1 for a in stock_alerts if a.alert_type == "LOW_STOCK")
    expiring_soon_count = sum(1 for a in stock_alerts if a.alert_type in ("EXPIRING_SOON", "EXPIRED"))

    # 11. Computed MoH EHSTG Safety Index (0–100 derived from live clinical indicators)
    safety_score = 100.0
    safety_score -= min(ssi_rate_pct * 3.0, 20.0)
    safety_score -= min(hai_total * 1.5, 15.0)
    if ot_total > 0:
        unverified_ratio = (ot_total - ot_checklist_verified) / ot_total
        safety_score -= min(unverified_ratio * 15.0, 15.0)
    safety_score -= min(low_stock_count * 0.5, 10.0)
    safety_score = round(max(0.0, min(100.0, safety_score)), 1)

    return ExecutiveSummaryResponse(
        time_range=normalized_range,
        generated_at=now.isoformat(),
        total_patients_registered=total_patients,
        new_patients_in_period=new_patients_period,
        patient_growth_percent=patient_growth_pct,
        outpatients_today=outpatients_count,
        active_inpatient_admissions=active_admissions,
        total_beds=total_beds,
        occupied_beds=effective_occupied,
        available_beds=available_beds,
        bed_occupancy_rate_percent=bor,
        daily_gross_revenue_etb=round(gross_rev, 2),
        telebirr_collection_etb=round(telebirr_rev, 2),
        cash_collection_etb=round(cash_rev, 2),
        cbhi_claims_etb=round(cbhi_claims, 2),
        revenue_breakdown=breakdown,
        outpatient_triage_distribution=workload,
        ward_occupancy_breakdown=ward_breakdown,
        pharmacy_low_stock_count=low_stock_count,
        pharmacy_expiring_soon_count=expiring_soon_count,
        emergency_admissions_in_period=emergency_admissions,
        ot_surgeries_total=ot_total,
        ot_surgeries_completed=ot_completed,
        lab_orders_total=lab_total,
        lab_orders_completed=lab_completed,
        average_length_of_stay_days=alos_days,
        bed_turnover_rate=bed_turnover,
        hai_cases_count=hai_total,
        surgical_site_infection_rate_percent=ssi_rate_pct,
        moh_safety_index_score=safety_score,
    )


def build_executive_summary_csv(summary: ExecutiveSummaryResponse) -> str:
    """Serialize ExecutiveSummaryResponse into a real MoH / EHSTG KPI CSV report."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Mettu Karl Comprehensive Specialized Hospital — Executive BI & MoH KPI Report"])
    writer.writerow(["Time Range", summary.time_range.upper()])
    writer.writerow(["Generated At (UTC)", summary.generated_at])
    writer.writerow([])

    writer.writerow(["Section", "Indicator", "Value", "Unit / Notes"])
    writer.writerow(["Patient Census", "Total Registered Patients", summary.total_patients_registered, "Patients"])
    writer.writerow(["Patient Census", "New Patients in Period", summary.new_patients_in_period, "Patients"])
    writer.writerow(["Patient Census", "Registration Growth vs Previous Period", summary.patient_growth_percent, "%"])
    writer.writerow(["Outpatient (OPD)", "OPD Queue Visits in Period", summary.outpatients_today, "Visits"])
    writer.writerow(["Inpatient (IPD)", "Active Inpatient Admissions", summary.active_inpatient_admissions, "Admissions"])
    writer.writerow(["Inpatient (IPD)", "Total Active Beds", summary.total_beds, "Beds"])
    writer.writerow(["Inpatient (IPD)", "Occupied Beds", summary.occupied_beds, "Beds"])
    writer.writerow(["Inpatient (IPD)", "Available Beds", summary.available_beds, "Beds"])
    writer.writerow(["Inpatient (IPD)", "Bed Occupancy Rate (BOR)", summary.bed_occupancy_rate_percent, "%"])
    writer.writerow(["Inpatient (IPD)", "Emergency Admissions in Period", summary.emergency_admissions_in_period, "Admissions"])
    writer.writerow(["EHSTG Quality", "Average Length of Stay (ALOS)", summary.average_length_of_stay_days, "Days"])
    writer.writerow(["EHSTG Quality", "Bed Turnover Rate", summary.bed_turnover_rate, "Discharges / Bed"])
    writer.writerow(["EHSTG Quality", "Surgical Site Infection (SSI) Rate", summary.surgical_site_infection_rate_percent, "%"])
    writer.writerow(["EHSTG Quality", "Hospital-Acquired Infections (HAI)", summary.hai_cases_count, "Cases"])
    writer.writerow(["EHSTG Quality", "MoH Safety Index Score", summary.moh_safety_index_score, "/ 100"])
    writer.writerow(["Clinical Ops", "OT Surgeries Total", summary.ot_surgeries_total, "Cases"])
    writer.writerow(["Clinical Ops", "OT Surgeries Completed", summary.ot_surgeries_completed, "Cases"])
    writer.writerow(["Clinical Ops", "Lab Orders Total", summary.lab_orders_total, "Orders"])
    writer.writerow(["Clinical Ops", "Lab Orders Completed", summary.lab_orders_completed, "Orders"])
    writer.writerow(["Pharmacy", "Low Stock Alerts", summary.pharmacy_low_stock_count, "Items"])
    writer.writerow(["Pharmacy", "Expiring Soon / Expired Alerts", summary.pharmacy_expiring_soon_count, "Batches"])
    writer.writerow(["Finance", "Gross Revenue Collected", summary.daily_gross_revenue_etb, "ETB"])
    writer.writerow(["Finance", "Telebirr Collections", summary.telebirr_collection_etb, "ETB"])
    writer.writerow(["Finance", "Cash Collections", summary.cash_collection_etb, "ETB"])
    writer.writerow(["Finance", "CBHI Insurance Claims Covered", summary.cbhi_claims_etb, "ETB"])

    writer.writerow([])
    writer.writerow(["Revenue Breakdown", "Channel", "Amount (ETB)", "Share (%)"])
    for item in summary.revenue_breakdown:
        writer.writerow(["Revenue", item.category, item.total_birr, f"{item.percentage}%"])

    if summary.ward_occupancy_breakdown:
        writer.writerow([])
        writer.writerow(["Ward Census", "Ward Code", "Ward Name", "Occupied / Total (BOR %)"])
        for w in summary.ward_occupancy_breakdown:
            writer.writerow([
                "Ward",
                w.ward_code,
                w.ward_name,
                f"{w.occupied_beds} / {w.total_beds} ({w.occupancy_percent}%)",
            ])

    if summary.outpatient_triage_distribution:
        writer.writerow([])
        writer.writerow(["Department Workload", "Department", "Patient Visits", "Period"])
        for d in summary.outpatient_triage_distribution:
            writer.writerow(["OPD Department", d.department, d.patient_count, summary.time_range])

    return output.getvalue()
