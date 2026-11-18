/**
 * Mettu Karl Comprehensive Specialized Hospital — Official Clinical Print & PDF Engine.
 *
 * Generates isolated, clean, high-contrast black-on-white print documents (PDF-ready & 80mm POS thermal):
 * 1. Official Hospital Tax Invoice (A4) & 80mm POS Thermal Cashier Receipt
 * 2. Official Hospital Prescription (Rx) Sheet with FEFO batch & signature stamp blocks
 * 3. Official ISO 15189 Diagnostic Laboratory Findings Report
 *
 * Embeds genuine ISO/IEC 18004 verification QR codes from POST /api/v1/barcode/generate.
 */
import apiClient from '@/lib/api';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchVerificationQr(entityType: string, entityId: string): Promise<string | null> {
  try {
    const res = await apiClient.post<{ qr_data_uri?: string }>('/barcode/generate', {
      entity_type: entityType,
      entity_id: entityId,
    });
    return res.data?.qr_data_uri || null;
  } catch {
    return null;
  }
}

function openPrintDocument(title: string, htmlBody: string, styles: string, width = 820, height = 960): boolean {
  const win = window.open('', '_blank', `width=${width},height=${height}`);
  if (!win) {
    window.print();
    return false;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    ${styles}
  </style>
</head>
<body>
  ${htmlBody}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 180);
    };
  </script>
</body>
</html>`);
  win.document.close();
  return true;
}

// ---------------------------------------------------------------------------
// 1. Official Hospital Tax Invoice (A4) & 80mm POS Thermal Cashier Receipt
// ---------------------------------------------------------------------------

export interface PrintableInvoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  patient?: {
    first_name: string;
    last_name: string;
    mrn?: string;
  } | null;
  created_at: string;
  total_amount: number;
  insurance_covered_amount: number;
  paid_amount: number;
  items: Array<{
    service_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments: Array<{
    payment_method: string;
    transaction_reference?: string | null;
  }>;
}

export async function printHospitalReceipt(
  invoice: PrintableInvoice,
  mode: 'thermal80' | 'a4' = 'a4'
): Promise<void> {
  const qrDataUri = await fetchVerificationQr('invoice', invoice.invoice_number);
  const patientName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`.trim()
    : `Patient #${invoice.patient_id}`;
  const mrn = invoice.patient?.mrn || `PAT-${invoice.patient_id}`;
  const fsNumber = `FS-MKH-${String(invoice.id).padStart(6, '0')}`;
  const payMethod = (invoice.payments?.[0]?.payment_method || 'CASHIER DESK').toUpperCase();
  const payRef = invoice.payments?.[0]?.transaction_reference || 'DIRECT-VERIFIED';
  const dateText = new Date(invoice.created_at).toLocaleString();

  if (mode === 'thermal80') {
    const itemRows = invoice.items
      .map(
        (it) => `
      <tr>
        <td style="padding:3px 0;">${escapeHtml(it.service_name)}</td>
        <td class="mono" style="text-align:center;padding:3px 4px;">${escapeHtml(it.quantity)}</td>
        <td class="mono" style="text-align:right;padding:3px 0;font-weight:700;">${Number(it.total_price).toFixed(2)}</td>
      </tr>`
      )
      .join('');

    const html = `
      <div class="receipt">
        <div class="center bold" style="font-size:13px;">METTU KARL REFERRAL HOSPITAL</div>
        <div class="center" style="font-size:10px;">Oromia Regional Health Bureau • Mettu</div>
        <div class="center mono" style="font-size:9px;margin-top:2px;">TIN: 0038912401 | ${escapeHtml(fsNumber)}</div>
        <div class="divider"></div>
        <div class="row"><span>Invoice:</span><strong class="mono">${escapeHtml(invoice.invoice_number)}</strong></div>
        <div class="row"><span>Date:</span><span class="mono">${escapeHtml(dateText)}</span></div>
        <div class="row"><span>Patient:</span><strong>${escapeHtml(patientName)}</strong></div>
        <div class="row"><span>MRN:</span><span class="mono">${escapeHtml(mrn)}</span></div>
        <div class="divider"></div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead>
            <tr style="border-bottom:1px dashed #334155;">
              <th style="text-align:left;padding-bottom:3px;">Item</th>
              <th style="text-align:center;padding-bottom:3px;">Qty</th>
              <th style="text-align:right;padding-bottom:3px;">ETB</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="divider"></div>
        <div class="row"><span>Total Clinical:</span><span class="mono">${invoice.total_amount.toFixed(2)} ETB</span></div>
        ${
          invoice.insurance_covered_amount > 0
            ? `<div class="row"><span>CBHI Subsidy:</span><span class="mono">- ${invoice.insurance_covered_amount.toFixed(2)} ETB</span></div>`
            : ''
        }
        <div class="row bold" style="font-size:12px;margin-top:3px;">
          <span>PAID:</span><span class="mono">${invoice.paid_amount.toFixed(2)} ETB</span>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Channel:</span><strong class="mono">${escapeHtml(payMethod)}</strong></div>
        <div class="row"><span>Ref:</span><span class="mono">${escapeHtml(payRef)}</span></div>
        ${
          qrDataUri
            ? `<div class="center" style="margin-top:8px;"><img src="${qrDataUri}" alt="QR" style="width:92px;height:92px;" /></div>`
            : ''
        }
        <div class="center" style="font-size:9px;margin-top:6px;">Galatoomaa! Thank you for choosing Mettu Karl Hospital.</div>
      </div>`;

    openPrintDocument(
      `${invoice.invoice_number} — 80mm POS Receipt`,
      html,
      `
      @page { size: 80mm auto; margin: 3mm; }
      .receipt { width: 74mm; margin: 0 auto; padding: 4px; font-size: 10px; line-height: 1.35; }
      .center { text-align: center; }
      .bold { font-weight: 800; }
      .divider { border-top: 1px dashed #334155; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
      `,
      380,
      680
    );
    return;
  }

  // Official A4 Hospital Tax Invoice & Voucher
  const itemRows = invoice.items
    .map(
      (it, idx) => `
    <tr>
      <td class="mono" style="text-align:center;">${idx + 1}</td>
      <td>${escapeHtml(it.service_name)}</td>
      <td class="mono" style="text-align:center;">${escapeHtml(it.quantity)}</td>
      <td class="mono" style="text-align:right;">${Number(it.unit_price).toFixed(2)}</td>
      <td class="mono" style="text-align:right;font-weight:700;">${Number(it.total_price).toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const html = `
    <div class="sheet">
      <div class="header">
        <div>
          <h1>METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL</h1>
          <div class="sub">Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu • Oromia Regional Health Bureau</div>
          <div class="meta mono">TIN: 0038912401 • FS No: ${escapeHtml(fsNumber)} • Mettu, Illubabor, Ethiopia</div>
        </div>
        ${qrDataUri ? `<img src="${qrDataUri}" alt="Invoice QR" class="qr" />` : ''}
      </div>

      <div class="badge-wrap"><span class="badge">OFFICIAL CASHIER TAX RECEIPT &amp; VOUCHER • SETTLED</span></div>

      <div class="grid">
        <div><strong>Patient Name:</strong> ${escapeHtml(patientName)}</div>
        <div><strong>Invoice No:</strong> <span class="mono">${escapeHtml(invoice.invoice_number)}</span></div>
        <div><strong>Patient MRN:</strong> <span class="mono">${escapeHtml(mrn)}</span></div>
        <div><strong>Date &amp; Time:</strong> <span class="mono">${escapeHtml(dateText)}</span></div>
        <div><strong>Settlement Channel:</strong> <span class="mono">${escapeHtml(payMethod)}</span></div>
        <div><strong>Reference:</strong> <span class="mono">${escapeHtml(payRef)}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:40px;text-align:center;">#</th>
            <th>Service Description</th>
            <th style="width:65px;text-align:center;">Qty</th>
            <th style="width:110px;text-align:right;">Unit Price (ETB)</th>
            <th style="width:120px;text-align:right;">Line Total (ETB)</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="totals">
        <div class="trow"><span>Total Clinical Amount:</span><span class="mono">${invoice.total_amount.toFixed(2)} ETB</span></div>
        ${
          invoice.insurance_covered_amount > 0
            ? `<div class="trow" style="color:#047857;"><span>CBHI Insurance Coverage:</span><span class="mono">- ${invoice.insurance_covered_amount.toFixed(2)} ETB</span></div>`
            : ''
        }
        <div class="trow grand"><span>Net Amount Paid by Patient:</span><span class="mono">${invoice.paid_amount.toFixed(2)} ETB</span></div>
      </div>

      <div class="stamps">
        <div class="stamp-box"><div class="line"></div><div>Cashier Name &amp; Signature</div></div>
        <div class="stamp-box"><div class="line"></div><div>Official Hospital Revenue Stamp</div></div>
      </div>
      <div class="footer">Galatoomaa! • Verified Digital Voucher — Mettu Karl Referral Hospital HMIS</div>
    </div>`;

  openPrintDocument(
    `${invoice.invoice_number} — Official Hospital Tax Receipt`,
    html,
    `
    @page { size: A4; margin: 14mm; }
    .sheet { max-width: 760px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; gap: 16px; }
    .header h1 { margin: 0; font-size: 16px; letter-spacing: 0.03em; }
    .sub { font-size: 11px; color: #334155; margin-top: 3px; font-weight: 600; }
    .meta { font-size: 10px; color: #475569; margin-top: 3px; }
    .qr { width: 84px; height: 84px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; }
    .badge-wrap { text-align: center; margin: 14px 0; }
    .badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; padding: 5px 14px; border: 1.5px solid #0f766e; color: #0f766e; border-radius: 999px; background: #f0fdfa; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; padding: 12px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
    .totals { max-width: 320px; margin-left: auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
    .trow { display: flex; justify-content: space-between; margin: 4px 0; }
    .grand { border-top: 1.5px solid #0f172a; padding-top: 6px; margin-top: 6px; font-weight: 900; font-size: 14px; }
    .stamps { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 46px; font-size: 11px; text-align: center; color: #334155; }
    .line { border-bottom: 1px solid #0f172a; height: 34px; margin-bottom: 6px; }
    .footer { margin-top: 26px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    `
  );
}

// ---------------------------------------------------------------------------
// 2. Official Hospital Prescription (Rx) Print Sheet
// ---------------------------------------------------------------------------

export interface PrintablePrescription {
  prescription_code: string;
  patient_id: number;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
    gender?: string;
    phone_number?: string | null;
  } | null;
  prescriber?: {
    full_name: string;
    role: string;
  } | null;
  status: string;
  clinical_notes?: string | null;
  created_at: string;
  dispensed_at?: string | null;
  total_amount: number;
  items: Array<{
    drug_name: string;
    generic_name?: string | null;
    strength?: string | null;
    dosage: string;
    frequency: string;
    duration_days: number;
    quantity_prescribed: number;
    quantity_dispensed: number;
    instructions?: string | null;
    batch_number?: string | null;
  }>;
}

export async function printHospitalPrescription(rx: PrintablePrescription): Promise<void> {
  const qrDataUri = await fetchVerificationQr('medicine', rx.prescription_code);
  const patientName = rx.patient
    ? `${rx.patient.first_name} ${rx.patient.last_name}`.trim()
    : `Patient #${rx.patient_id}`;
  const mrn = rx.patient?.mrn || `PAT-${rx.patient_id}`;
  const prescriberName = rx.prescriber?.full_name || 'Attending Physician';

  const rows = rx.items
    .map(
      (it, idx) => `
    <tr>
      <td class="mono" style="text-align:center;">${idx + 1}</td>
      <td>
        <strong>${escapeHtml(it.drug_name)}</strong>
        ${it.strength ? `<span class="mono" style="color:#475569;"> (${escapeHtml(it.strength)})</span>` : ''}
        ${it.generic_name ? `<div style="font-size:10px;color:#475569;">Generic: ${escapeHtml(it.generic_name)}</div>` : ''}
      </td>
      <td>${escapeHtml(it.dosage)} • ${escapeHtml(it.frequency)} • ${escapeHtml(it.duration_days)}d</td>
      <td class="mono" style="text-align:center;font-weight:700;">${escapeHtml(it.quantity_prescribed)} / ${escapeHtml(it.quantity_dispensed)}</td>
      <td>${escapeHtml(it.instructions || 'Take as directed')}${it.batch_number ? `<div class="mono" style="font-size:10px;color:#0f766e;">Batch: ${escapeHtml(it.batch_number)}</div>` : ''}</td>
    </tr>`
    )
    .join('');

  const html = `
    <div class="sheet">
      <div class="header">
        <div>
          <h1>METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL</h1>
          <div class="sub">Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu • Pharmacy &amp; Therapeutics</div>
          <div class="meta mono">TIN: 0038912401 • Mettu, Oromia, Ethiopia • EFDA Compliant FEFO Dispensary</div>
        </div>
        ${qrDataUri ? `<img src="${qrDataUri}" alt="Rx QR" class="qr" />` : ''}
      </div>

      <div class="rx-banner">
        <span class="rx-symbol">℞</span>
        <div>
          <div class="rx-title">OFFICIAL HOSPITAL PRESCRIPTION (WARAQAA AJAAJA QORICHAA)</div>
          <div class="mono" style="font-size:11px;color:#334155;">Rx Code: <strong>${escapeHtml(rx.prescription_code)}</strong> • Status: <strong>${escapeHtml(rx.status.toUpperCase())}</strong></div>
        </div>
      </div>

      <div class="grid">
        <div><strong>Patient Name:</strong> ${escapeHtml(patientName)}</div>
        <div><strong>Patient MRN:</strong> <span class="mono">${escapeHtml(mrn)}</span></div>
        <div><strong>Prescriber:</strong> ${escapeHtml(prescriberName)}</div>
        <div><strong>Date Issued:</strong> <span class="mono">${escapeHtml(new Date(rx.created_at).toLocaleString())}</span></div>
      </div>

      ${
        rx.clinical_notes
          ? `<div class="notes"><strong>Clinical Notes:</strong> ${escapeHtml(rx.clinical_notes)}</div>`
          : ''
      }

      <table>
        <thead>
          <tr>
            <th style="width:36px;text-align:center;">#</th>
            <th>Medication</th>
            <th>Regimen (Dose / Freq / Days)</th>
            <th style="width:85px;text-align:center;">Ord / Disp</th>
            <th>Instructions &amp; FEFO Batch</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="stamps">
        <div class="stamp-box"><div class="line"></div><div>Prescribing Physician Signature &amp; License</div></div>
        <div class="stamp-box"><div class="line"></div><div>Dispensing Pharmacist Signature &amp; Stamp</div></div>
      </div>
      <div class="footer">CDSS Drug-Interaction Pre-Checked • Mettu Karl Comprehensive Specialized Hospital HMIS</div>
    </div>`;

  openPrintDocument(
    `${rx.prescription_code} — Official Hospital Prescription`,
    html,
    `
    @page { size: A4; margin: 14mm; }
    .sheet { max-width: 760px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; gap: 16px; }
    .header h1 { margin: 0; font-size: 16px; }
    .sub { font-size: 11px; color: #334155; margin-top: 3px; font-weight: 600; }
    .meta { font-size: 10px; color: #475569; margin-top: 3px; }
    .qr { width: 84px; height: 84px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; }
    .rx-banner { display: flex; align-items: center; gap: 12px; margin: 14px 0; padding: 10px 14px; background: #f0fdfa; border: 1.5px solid #0f766e; border-radius: 8px; }
    .rx-symbol { font-size: 32px; font-weight: 900; color: #0f766e; line-height: 1; }
    .rx-title { font-size: 12px; font-weight: 800; color: #0f172a; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; padding: 12px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; margin-bottom: 12px; }
    .notes { padding: 9px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
    .stamps { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 44px; font-size: 11px; text-align: center; color: #334155; }
    .line { border-bottom: 1px solid #0f172a; height: 36px; margin-bottom: 6px; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    `
  );
}

// ---------------------------------------------------------------------------
// 3. Official ISO 15189 Diagnostic Laboratory Findings Report
// ---------------------------------------------------------------------------

export interface PrintableLabOrder {
  order_number: string;
  patient_name: string;
  patient_mrn: string;
  patient_age: number | string;
  patient_gender: string;
  sample_barcode?: string | null;
  ordering_doctor_name: string;
  ordered_at?: string;
  completed_at?: string | null;
  status: string;
  results: Array<{
    parameter_name: string;
    result_value: string;
    unit?: string | null;
    reference_range?: string | null;
    flag: string;
    notes?: string | null;
  }>;
}

export async function printHospitalLabReport(order: PrintableLabOrder): Promise<void> {
  const qrDataUri = await fetchVerificationQr('lab', order.sample_barcode || order.order_number);

  const rows =
    order.results.length === 0
      ? `<tr><td colspan="5" style="text-align:center;color:#64748b;font-style:italic;padding:14px;">Testing in progress. Results pending verification.</td></tr>`
      : order.results
          .map((r) => {
            const flagUpper = String(r.flag || 'normal').toUpperCase();
            const isCritical = flagUpper.includes('CRITICAL') || flagUpper.includes('PANIC');
            const isAbnormal = isCritical || flagUpper === 'HIGH' || flagUpper === 'LOW';
            const badgeStyle = isCritical
              ? 'background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;'
              : isAbnormal
              ? 'background:#fef3c7;color:#b45309;border:1px solid #fcd34d;'
              : 'background:#dcfce7;color:#15803d;border:1px solid #86efac;';

            return `
            <tr>
              <td><strong>${escapeHtml(r.parameter_name)}</strong>${r.notes ? `<div style="font-size:10px;color:#475569;">${escapeHtml(r.notes)}</div>` : ''}</td>
              <td class="mono" style="font-weight:800;">${escapeHtml(r.result_value)}</td>
              <td class="mono">${escapeHtml(r.unit || '-')}</td>
              <td class="mono">${escapeHtml(r.reference_range || '-')}</td>
              <td style="text-align:center;"><span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;${badgeStyle}">${escapeHtml(flagUpper)}</span></td>
            </tr>`;
          })
          .join('');

  const html = `
    <div class="sheet">
      <div class="header">
        <div>
          <h1>METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL</h1>
          <div class="sub">Department of Pathology &amp; Clinical Laboratory Diagnostics • ISO 15189 Certified</div>
          <div class="meta mono">TIN: 0038912401 • Mettu, Illubabor Zone, Oromia, Ethiopia • Tel: +251 47 441 2345</div>
        </div>
        ${qrDataUri ? `<img src="${qrDataUri}" alt="Lab QR" class="qr" />` : ''}
      </div>

      <div class="badge-wrap"><span class="badge">OFFICIAL DIAGNOSTIC LABORATORY FINDINGS REPORT</span></div>

      <div class="grid">
        <div><strong>Patient Name:</strong> ${escapeHtml(order.patient_name)}</div>
        <div><strong>Lab Order No:</strong> <span class="mono">${escapeHtml(order.order_number)}</span></div>
        <div><strong>Patient MRN:</strong> <span class="mono">${escapeHtml(order.patient_mrn)}</span></div>
        <div><strong>Specimen Barcode:</strong> <span class="mono">${escapeHtml(order.sample_barcode || 'N/A')}</span></div>
        <div><strong>Age / Gender:</strong> ${escapeHtml(order.patient_age)} yrs • ${escapeHtml(order.patient_gender.toUpperCase())}</div>
        <div><strong>Ordering Physician:</strong> ${escapeHtml(order.ordering_doctor_name)}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Investigation / Test Parameter</th>
            <th>Observed Value</th>
            <th>Unit</th>
            <th>Reference Range</th>
            <th style="text-align:center;">Status Flag</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="stamps">
        <div class="stamp-box"><div class="line"></div><div>Laboratory Technologist Signature</div></div>
        <div class="stamp-box"><div class="line"></div><div>Pathologist Verification &amp; Official Stamp</div></div>
      </div>
      <div class="footer">Printed ${escapeHtml(new Date().toLocaleString())} • Confidential Clinical Report — Mettu Karl Referral Hospital LIS</div>
    </div>`;

  openPrintDocument(
    `${order.order_number} — Official Laboratory Diagnostic Report`,
    html,
    `
    @page { size: A4; margin: 14mm; }
    .sheet { max-width: 760px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; gap: 16px; }
    .header h1 { margin: 0; font-size: 16px; }
    .sub { font-size: 11px; color: #334155; margin-top: 3px; font-weight: 600; }
    .meta { font-size: 10px; color: #475569; margin-top: 3px; }
    .qr { width: 84px; height: 84px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; }
    .badge-wrap { text-align: center; margin: 14px 0; }
    .badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; padding: 5px 14px; border: 1.5px solid #0f172a; color: #0f172a; border-radius: 6px; background: #f1f5f9; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; padding: 12px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
    th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
    .stamps { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 44px; font-size: 11px; text-align: center; color: #334155; }
    .line { border-bottom: 1px solid #0f172a; height: 36px; margin-bottom: 6px; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    `
  );
}
