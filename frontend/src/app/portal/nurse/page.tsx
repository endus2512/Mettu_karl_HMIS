/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Nurse & Inpatient Care Workstation Portal (/portal/nurse).
 *
 * Isolated Role Capabilities:
 * - Inpatient Bed Census & Ward Occupancy Matrix
 * - Medication Administration Record (MAR) & Dose Schedule
 * - Acuity Triage Scoring, Bedside Vitals Intake & Care Tasks
 * - Strict Role Isolation: Non-authorized personnel are restricted; Supervisors can inspect.
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { NurseDashboardView } from '@/components/dashboard/NurseDashboardView';

export default function NursePortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['nurse']}
      workstationRoleName="Nurse & Ward Station"
    >
      <NurseDashboardView />
    </RoleWorkstationShell>
  );
}
