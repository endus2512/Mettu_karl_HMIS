/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Pharmacist & Dispensary Workstation Portal (/portal/pharmacy).
 *
 * Isolated Role Capabilities:
 * - Prescription Dispensing Queue & Barcode Validation
 * - FEFO Expiry Tracking & Critical Low-Stock Inventory Alerts
 * - EFDA Safety Reporting, Adverse Drug Reaction (ADR) Logs
 * - Strict Role Isolation: Non-authorized personnel are restricted; Supervisors can inspect.
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { PharmacistDashboardView } from '@/components/dashboard/PharmacistDashboardView';

export default function PharmacyPortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['pharmacist']}
      workstationRoleName="Pharmacy & FEFO Dispensary"
    >
      <PharmacistDashboardView />
    </RoleWorkstationShell>
  );
}
