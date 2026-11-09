/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Cashier, Billing & Insurance Workstation Portal (/portal/billing).
 *
 * Isolated Role Capabilities:
 * - Real-Time Telebirr POS Transactions & Cash Invoicing
 * - Community-Based Health Insurance (CBHI) Claims & Approvals
 * - Departmental Revenue Reconciliation & Clearance Receipts
 * - Strict Role Isolation: Non-authorized personnel are restricted; Supervisors can inspect.
 */
'use client';

import React from 'react';
import { RoleWorkstationShell } from '@/components/layout/RoleWorkstationShell';
import { BillingDashboardView } from '@/components/dashboard/BillingDashboardView';

export default function BillingPortalPage(): React.ReactElement {
  return (
    <RoleWorkstationShell
      allowedRoles={['billing', 'insurance_officer']}
      workstationRoleName="Billing, Cashier & Insurance Desk"
    >
      <BillingDashboardView />
    </RoleWorkstationShell>
  );
}
