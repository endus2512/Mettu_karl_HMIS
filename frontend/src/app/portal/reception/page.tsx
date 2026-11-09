/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Reception, Triage & Queue Counter Workstation Portal (/portal/reception).
 *
 * Isolated Role Capabilities:
 * - Patient Intake, Master Patient Index (MPI) Registration
 * - National Digital ID (Fayda) Biometric Verification
 * - Acuity Token Printing & Waiting Room Display System
 * - Strict Role Isolation: Non-authorized personnel are restricted; Supervisors can inspect.
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { ReceptionistDashboardView } from '@/components/dashboard/ReceptionistDashboardView';

export default function ReceptionPortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['receptionist']}
      workstationRoleName="Reception, Fayda & Queue Counter"
    >
      <ReceptionistDashboardView />
    </RoleWorkstationShell>
  );
}
