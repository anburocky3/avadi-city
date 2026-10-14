"use client";

import React from "react";
import { Check } from "lucide-react";

export interface ChipOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

export interface ChipSelectProps {
  options: (string | ChipOption)[];
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  accent?: "primary" | "teal";
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export const ChipSelect: React.FC<ChipSelectProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  accent = "primary",
  className = "",
  disabled = false,
  size = "md",
}) => {
  const isSelected = (val: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(val);
    }
    return value === val;
  };

  const handleClick = (val: string) => {
    if (disabled) return;
    if (multiple) {
      const arr = Array.isArray(value) ? [...value] : [];
      if (arr.includes(val)) {
        onChange(arr.filter((item) => item !== val));
      } else {
        onChange([...arr, val]);
      }
    } else {
      onChange(val);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const optionValue = typeof opt === "string" ? opt : opt.value;
        const optionLabel = typeof opt === "string" ? opt : opt.label;
        const optionIcon = typeof opt === "string" ? null : opt.icon;
        const selected = isSelected(optionValue);

        const activeStyles =
          accent === "teal"
            ? "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20"
            : "bg-primary text-white border-primary shadow-sm shadow-orange-500/20";

        const inactiveStyles =
          "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900";

        const sizeStyles =
          size === "sm"
            ? "px-2.5 py-1 text-[11px] rounded-lg"
            : "px-3 py-1.5 text-xs rounded-xl";

        return (
          <button
            key={optionValue}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(optionValue)}
            aria-pressed={selected}
            className={`font-bold border transition-all flex items-center gap-1.5 select-none cursor-pointer ${sizeStyles} ${
              selected ? activeStyles : inactiveStyles
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {optionIcon && <span className="shrink-0">{optionIcon}</span>}
            {selected && multiple && <Check size={12} strokeWidth={3} />}
            <span>{optionLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelect;
