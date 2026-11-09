/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Executive Command Center Portal (/portal/admin).
 *
 * Supervisor Capabilities:
 * - Real-time hospital operations, ward bed capacity, and shift overrides
 * - Live On-Duty Staff Supervision Directory (AdminOversightHub)
 * - 1-Click Inspection into every departmental role workstation
 * - INSA Cryptographic Forensic Audit & Resilience Telemetry
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { AdminDashboardView } from '@/components/dashboard/AdminDashboardView';

export default function AdminPortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['admin', 'super_admin']}
      workstationRoleName="Executive Administration Command"
    >
      <AdminDashboardView />
    </RoleWorkstationShell>
  );
}
