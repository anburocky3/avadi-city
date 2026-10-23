"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared-components";
import { Volunteer } from "@/types/volunteer";
import { FormField } from "./FormField";
import { isValidIndianPhone } from "@/utils/validators";
import toast from "@/utils/toast";
import { Lock, Send, ShieldCheck } from "lucide-react";

export interface RequestContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: Volunteer | null;
  currentUserName?: string;
  currentUserPhone?: string;
}

export const RequestContactModal: React.FC<RequestContactModalProps> = ({
  isOpen,
  onClose,
  volunteer,
  currentUserName = "",
  currentUserPhone = "",
}) => {
  const [name, setName] = useState(currentUserName);
  const [phone, setPhone] = useState(currentUserPhone);
  const [purpose, setPurpose] = useState(
    "Monsoon Civic Relief / Volunteer Drive Coordination",
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!volunteer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Your name is required.";
    if (!phone || !isValidIndianPhone(phone)) {
      newErrors.phone = "Valid 10-digit phone number is required.";
    }
    if (!purpose.trim()) newErrors.purpose = "Please select a purpose.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(
        `Contact request submitted to ${volunteer.fullName}. They will receive your details securely.`,
      );
      onClose();
      setMessage("");
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Contact with Volunteer"
      maxWidth="sm:max-w-md"
    >
      <div className="space-y-4">
        {/* Privacy note */}
        <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-400 flex items-start gap-2.5">
          <Lock size={16} className="text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {volunteer.fullName} has phone privacy enabled.
            </p>
            <p className="text-[11px] text-teal-700/80 dark:text-teal-400/80 mt-0.5">
              Submit this brief civic request. The volunteer will review your
              purpose and may reach back via call or WhatsApp.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormField label="Your Full Name" required error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </FormField>

          <FormField
            label="Your Mobile Number (10 digits)"
            required
            error={errors.phone}
          >
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="9840123456"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </FormField>

          <FormField label="Purpose of Contact" required error={errors.purpose}>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="Monsoon Civic Relief / Volunteer Drive Coordination">
                Monsoon Civic Relief / Volunteer Drive
              </option>
              <option value="Emergency Blood Requirement">
                Emergency Blood Requirement ({volunteer.health.bloodGroup})
              </option>
              <option value="School / Educational Tutoring Drive">
                School / Educational Tutoring Drive
              </option>
              <option value="Animal Rescue / Shelter Support">
                Animal Rescue / Shelter Support
              </option>
              <option value="Ward Civic Clean-up Drive">
                Ward Civic Clean-up Drive
              </option>
              <option value="Other Community Need">Other Community Need</option>
            </select>
          </FormField>

          <FormField label="Additional Message / Note (Optional)">
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Need assistance this Saturday at Ward 14 Community Hall."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Send size={13} />
            <span>
              {isSubmitting ? "Sending Request..." : "Send Request to Volunteer"}
            </span>
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default RequestContactModal;
