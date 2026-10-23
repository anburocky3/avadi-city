"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, X } from "lucide-react";

export interface VolunteerAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const VolunteerAdvisoryModal: React.FC<VolunteerAdvisoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  confirmText = "I Understand & Confirm",
  cancelText = "Maybe Later",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
          >
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header with Caution / Volunteer Icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm border border-rose-200 dark:border-rose-900/40">
                <HeartHandshake size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider mb-1 shadow-xs shadow-rose-600/20">
                  VOLUNTEER COMMITMENT
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                  Citizen Volunteer Advisory
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Anyone can join as an Avadi Citizen Volunteer, but volunteers take on real responsibilities for our community. Please review these essential guidelines:
            </p>

            {/* Instructions List */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">🚨</span>
                <div className="leading-snug">
                  <strong className="text-slate-900 dark:text-slate-100 block text-xs">
                    Civic Responsibility &amp; Active Participation:
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                    Volunteers assist during local emergencies, food/clothing drives, blood donation alerts, and ward cleanliness campaigns in their neighborhood.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">📞</span>
                <div className="leading-snug">
                  <strong className="text-slate-900 dark:text-slate-100 block text-xs">
                    Active Phone &amp; WhatsApp Verification:
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                    A reachable contact number is mandatory. Ward coordinators and municipal responders verify volunteers to coordinate relief quickly.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">⚖️</span>
                <div className="leading-snug">
                  <strong className="text-slate-900 dark:text-slate-100 block text-xs">
                    Code of Conduct &amp; Resident Privacy:
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                    Treat all citizens with dignity, protect sensitive family information, follow coordinator instructions, and uphold community trust.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VolunteerAdvisoryModal;
