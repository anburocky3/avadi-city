"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Inbox, LucideIcon } from "lucide-react";

// --- TYPESCRIPT INTERFACES ---

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface BadgeProps {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info";
  children: React.ReactNode;
  className?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ElementType;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export interface SkeletonLoaderProps {
  type?: "card" | "tile" | "text";
  count?: number;
}

export interface SOSButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: "sm" | "md" | "lg";
}

// --- COMPONENTS ---

// Premium styled Card component
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
}) => {
  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Modal Overlay with entry/exit animations
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        // 1. Removed 'backdrop-blur-xs' from this static layout wrapper
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* 2. Added 'backdrop-blur-xs' here so it fades in/out with opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90svh] sm:max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Colored status Badges
export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  className = "",
}) => {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    primary:
      "bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50",
    secondary:
      "bg-teal-50 text-teal-700 border border-teal-100 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50",
    success:
      "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    danger:
      "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
    warning:
      "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    info: "bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Premium empty states placeholder
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
        <Icon size={32} />
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-orange-600 rounded-xl shadow-sm hover:shadow transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// Skeleton item loader
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = "card",
  count = 1,
}) => {
  const pulseClass = "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl";

  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full">
          {type === "card" && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 bg-white dark:bg-slate-900">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${pulseClass}`}></div>
                <div className="space-y-2 flex-1">
                  <div className={`h-4 w-1/3 ${pulseClass}`}></div>
                  <div className={`h-3 w-1/4 ${pulseClass}`}></div>
                </div>
              </div>
              <div className={`h-4 w-full ${pulseClass}`}></div>
              <div className={`h-4 w-5/6 ${pulseClass}`}></div>
              <div className="flex space-x-2 pt-2">
                <div className={`h-8 w-16 ${pulseClass}`}></div>
                <div className={`h-8 w-16 ${pulseClass}`}></div>
              </div>
            </div>
          )}
          {type === "tile" && (
            <div className="flex items-center space-x-4 p-4 border border-slate-100 dark:border-slate-600 rounded-xl">
              <div className={`w-12 h-12 ${pulseClass}`}></div>
              <div className="space-y-2 flex-1">
                <div className={`h-4 w-1/2 ${pulseClass}`}></div>
                <div className={`h-3 w-1/3 ${pulseClass}`}></div>
              </div>
            </div>
          )}
          {type === "text" && (
            <div className="space-y-2">
              <div className={`h-4 w-full ${pulseClass}`}></div>
              <div className={`h-4 w-5/6 ${pulseClass}`}></div>
              <div className={`h-4 w-2/3 ${pulseClass}`}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Pulsing Emergency SOS Tab / floating button
export const SOSButton: React.FC<SOSButtonProps> = ({
  onClick,
  size = "md",
}) => {
  const sizes: Record<NonNullable<SOSButtonProps["size"]>, string> = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-base",
    lg: "w-24 h-24 text-xl",
  };

  return (
    <button
      onClick={onClick}
      className={`relative rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-rose-700 cursor-pointer ${sizes[size]}`}
    >
      <span
        className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping"
        style={{ animationDuration: "1.5s" }}
      />
      <span className="absolute inset-0 rounded-full bg-rose-600/30 animate-pulse" />
      <ShieldAlert className="relative z-10" size={size === "lg" ? 44 : 24} />
    </button>
  );
};
