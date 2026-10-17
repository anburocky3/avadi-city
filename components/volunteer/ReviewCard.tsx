"use client";

import React from "react";
import { Edit3 } from "lucide-react";

export interface ReviewCardProps {
  title: string;
  stepId: number;
  onEdit: (stepId: number) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  title,
  stepId,
  onEdit,
  children,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:text-orange-600 transition cursor-pointer select-none px-2 py-0.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30"
        >
          <Edit3 size={12} />
          <span>Edit</span>
        </button>
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
        {children}
      </div>
    </div>
  );
};

export default ReviewCard;
