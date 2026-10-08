"use client";

import * as React from "react";

type ToastItem = {
  id: string | number;
  message: string;
  type?: "info" | "success" | "error" | "show";
};

export default function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string | number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 sm:bottom-10 sm:right-10 z-50 flex flex-col items-end gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto max-w-sm w-full rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 p-4 flex items-center gap-3.5 transition-all duration-300 animate-toast-in bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800"
        >
          {/* Status Icon */}
          <div className="shrink-0 flex items-center justify-center">
            {t.type === "success" ? (
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    d="M6 12l4 4 8-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-animate"
                  />
                </svg>
              </div>
            ) : t.type === "error" ? (
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-animate-cross"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    d="M12 11v5m0-8h.01"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-animate"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug tracking-tight">
              {t.message}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            aria-label="dismiss"
            onClick={() => onRemove(t.id)}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// Modern Smooth Animations
const style = `
@keyframes draw {
  to { stroke-dashoffset: 0; }
}
@keyframes drawCross {
  to { stroke-dashoffset: 0; }
}
.stroke-animate {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: draw 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.stroke-animate-cross {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: drawCross 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes toastIn { 
  from { opacity: 0; transform: translateY(12px) scale(0.95); } 
  to { opacity: 1; transform: translateY(0) scale(1); } 
}
.animate-toast-in { 
  animation: toastIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; 
}
`;

if (typeof document !== "undefined") {
  const el = document.createElement("style");
  el.setAttribute("data-generated", "toast-styles");
  el.appendChild(document.createTextNode(style));
  if (!document.querySelector('style[data-generated="toast-styles"]')) {
    document.head.appendChild(el);
  }
}
