/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Laboratory & Pathology Workstation Portal (/portal/lab).
 *
 * Isolated Role Capabilities:
 * - Specimen Barcode Worklist & Blood Sample Processing
 * - Sysmex Hematology & Clinical Chemistry Auto-Validation
 * - Critical Values Alerting to Attending Physicians
 * - Strict Role Isolation: Non-authorized personnel are restricted; Supervisors can inspect.
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { LabTechDashboardView } from '@/components/dashboard/LabTechDashboardView';

export default function LabPortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['technician', 'lab_tech', 'lab_technician']}
      workstationRoleName="Laboratory LIS & Pathology Bench"
    >
      <LabTechDashboardView />
    </RoleWorkstationShell>
  );
}
