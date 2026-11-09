/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Doctor & Clinical Specialist Workstation Portal (/portal/doctor).
 *
 * Isolated Role Capabilities:
 * - Patient EMR Charts, Active OPD & Emergency Waiting Roster
 * - Vital Signs Alerts & Clinical Decision Support (CDSS)
 * - Rapid Consultation, Order Entry & Electronic Prescription
 * - Strict Role Isolation: Non-authorized personnel are restricted; Supervisors can inspect.
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { DoctorDashboardView } from '@/components/dashboard/DoctorDashboardView';

export default function DoctorPortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['doctor']}
      workstationRoleName="Doctor & Physician Workstation"
    >
      <DoctorDashboardView />
    </RoleWorkstationShell>
  );
}
