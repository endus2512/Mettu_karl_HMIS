/**
 * Clinical Decision Support (CDSS) alert modal.
 * Flags critical drug-drug interactions and patient allergies before order confirmation.
 * Standardized with Lucide SVG iconography and dark mode support.
 */
'use client';

import React from 'react';
import { AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface InteractionWarning {
  drug_a: string;
  drug_b: string;
  severity: string;
  clinical_effect: string;
  recommendation: string;
}

export interface AllergyWarning {
  drug_name: string;
  allergen_substance: string;
  reaction: string;
  severity: string;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverrideConfirm: () => void;
  interactions: InteractionWarning[];
  allergies: AllergyWarning[];
}

export function AlertModal({
  isOpen,
  onClose,
  onOverrideConfirm,
  interactions,
  allergies,
}: AlertModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-rose-200 dark:border-rose-900/40 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 leading-tight">
              Clinical Decision Support (CDSS) Safety Alerts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contraindicated drug interactions or patient allergy alerts detected
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {/* Allergies */}
          {allergies.length > 0 && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 p-4">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-semibold text-xs mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Documented Patient Allergy Warnings</span>
              </div>
              <div className="space-y-2">
                {allergies.map((a, idx) => (
                  <div key={idx} className="text-xs text-rose-800 dark:text-rose-300">
                    <p>
                      <span className="font-bold">{a.drug_name}</span> triggers allergy to{' '}
                      <span className="font-bold underline">{a.allergen_substance}</span> ({a.reaction})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DDI Interactions */}
          {interactions.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold text-xs mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Drug-Drug Interaction (DDI) Risk</span>
              </div>
              <div className="space-y-2">
                {interactions.map((i, idx) => (
                  <div key={idx} className="border-t border-amber-200/60 dark:border-amber-900/40 pt-2 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold font-mono">
                      {i.drug_a} + {i.drug_b} ({i.severity.toUpperCase()})
                    </p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{i.clinical_effect}</p>
                    <p className="mt-1 font-medium text-amber-800 dark:text-amber-400">
                      Recommendation: {i.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel & Modify Prescription
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onOverrideConfirm}
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Clinical Override & Authorize
          </Button>
        </div>
      </div>
    </div>
  );
}
