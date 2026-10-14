"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared-components";
import { DonationRequest } from "@/types/donation";
import { FormField } from "@/components/volunteer/FormField";
import donationService from "@/services/donationService";
import toast from "@/utils/toast";
import { Flag, AlertTriangle } from "lucide-react";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: DonationRequest | null;
  onReportSubmitted: (updated: DonationRequest) => void;
}

const REPORT_REASONS = [
  "Suspicious or Fake civic appeal",
  "Incorrect or unreachable contact information",
  "Request is already fulfilled or outdated",
  "Commercial advertisement / Spam",
  "Inappropriate or offensive content",
  "Other reason",
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  donation,
  onReportSubmitted,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!donation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fullReason = details.trim() ? `${reason}: ${details.trim()}` : reason;
      const updated = donationService.reportRequest(donation.id, fullReason);
      toast.success(
        "Report submitted to Avadi Civic moderators. Thank you for keeping the platform safe.",
      );
      onReportSubmitted(updated);
      onClose();
      setDetails("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Donation Request"
      maxWidth="sm:max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-400 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Flagging: "{donation.title}"</p>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
              Reports are reviewed by ward volunteers and civic officers.
              Malicious false reports may lead to profile restrictions.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormField label="Reason for Reporting" required>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-rose-500 focus:outline-none"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Specific Details / Context (Optional)">
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Phone number was unreachable, or goods were already donated."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none resize-none"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Flag size={12} />
              <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReportModal;
