"use client";

import React from "react";

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children?: React.ReactNode;
  charCount?: { current: number; max: number };
  className?: string;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  children,
  charCount,
  className = "",
  htmlFor,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
          >
            <span>{label}</span>
            {required && (
              <span className="text-rose-500 font-black text-sm" title="Required">
                *
              </span>
            )}
          </label>
          {charCount && (
            <span
              className={`text-[10px] font-bold ${
                charCount.current > charCount.max
                  ? "text-rose-500 font-black"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
