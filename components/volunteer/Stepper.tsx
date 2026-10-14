"use client";

import React from "react";
import { Check } from "lucide-react";

export interface StepperProps {
  steps: { id: number; title: string; subtitle?: string }[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  maxValidStepReached?: number;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  maxValidStepReached = currentStep,
}) => {
  const total = steps.length;
  const progressPercent = Math.min(
    100,
    Math.round(((currentStep - 1) / (total - 1)) * 100),
  );

  return (
    <div className="w-full space-y-3">
      {/* Mobile step status & progress bar */}
      <div className="flex items-center justify-between text-xs font-bold sm:hidden">
        <span className="text-primary font-black uppercase tracking-wider text-[11px]">
          Step {currentStep} of {total}
        </span>
        <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[180px]">
          {steps.find((s) => s.id === currentStep)?.title}
        </span>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Desktop Stepper Dots & Labels */}
      <div className="hidden sm:grid grid-cols-5 gap-2 pt-1">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable =
            onStepClick && step.id <= Math.max(currentStep, maxValidStepReached);

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick && onStepClick(step.id)}
              className={`flex flex-col items-center text-center p-1.5 rounded-xl transition-all ${
                isClickable ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : "cursor-default"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all mb-1.5 ${
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-sm"
                    : isCurrent
                      ? "bg-primary text-white shadow-md ring-4 ring-orange-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
              </div>
              <span
                className={`text-[11px] font-extrabold leading-tight ${
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
