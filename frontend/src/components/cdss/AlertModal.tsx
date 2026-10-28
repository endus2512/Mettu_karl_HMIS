/**
 * Clinical Decision Support (CDSS) alert modal.
 * Flags critical drug-drug interactions and patient allergies before order confirmation.
 */
'use client';

import React from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-red-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl font-bold">
            ⚠️
          </span>
          <div>
            <h3 className="text-lg font-bold text-red-700">Clinical Safety Alerts (CDSS)</h3>
            <p className="text-xs text-gray-500">Adverse drug interactions or patient allergies detected</p>
          </div>
        </div>

        <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-2">
          {/* Allergies */}
          {allergies.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h4 className="font-semibold text-red-800 text-sm">🚨 Documented Patient Allergy Warnings</h4>
              {allergies.map((a, idx) => (
                <div key={idx} className="mt-2 text-xs text-red-700">
                  <p>
                    <span className="font-bold">{a.drug_name}</span> triggers allergy to{' '}
                    <span className="font-bold underline">{a.allergen_substance}</span> ({a.reaction})
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* DDI Interactions */}
          {interactions.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="font-semibold text-amber-800 text-sm">⚠️ Drug-Drug Interaction (DDI)</h4>
              {interactions.map((i, idx) => (
                <div key={idx} className="mt-2 border-t border-amber-100 pt-2 text-xs text-amber-900">
                  <p className="font-bold">{i.drug_a} + {i.drug_b} ({i.severity.toUpperCase()})</p>
                  <p className="mt-1 text-gray-700">{i.clinical_effect}</p>
                  <p className="mt-1 font-medium text-amber-800">Recommendation: {i.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel & Modify Rx
          </button>
          <button
            onClick={onOverrideConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Override with Justification
          </button>
        </div>
      </div>
    </div>
  );
}
