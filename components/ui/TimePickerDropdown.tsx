"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

interface TimePickerDropdownProps {
  id?: string;
  value: string;
  onChange: (time: string) => void;
  hasError?: boolean;
  className?: string;
  disabled?: boolean;
  placement?: "top" | "bottom" | "auto";
}

const HOURS = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const PERIODS = ["AM", "PM"] as const;

export function TimePickerDropdown({
  id,
  value,
  onChange,
  hasError = false,
  className = "",
  disabled = false,
  placement = "top",
}: TimePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<"hour" | "minute" | "period">("hour");
  const [openUpward, setOpenUpward] = useState(placement === "top");

  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Parse time value e.g. "12:17 AM", "9:00 AM", "09:00 AM", "10:00 PM"
  const parseTime = useCallback((val: string) => {
    const match = (val || "").trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (match) {
      const rawHour = parseInt(match[1], 10);
      const safeHour = rawHour >= 1 && rawHour <= 12 ? rawHour : 12;
      const hourStr = safeHour.toString().padStart(2, "0");
      const minStr = match[2].padStart(2, "0");
      const periodStr = ((match[3] || "AM").toUpperCase() === "PM" ? "PM" : "AM") as "AM" | "PM";
      return { hour: hourStr, minute: minStr, period: periodStr };
    }
    return { hour: "12", minute: "00", period: "AM" as const };
  }, []);

  const parsed = parseTime(value);

  // Format time and trigger onChange
  const emitChange = (h: string, m: string, p: "AM" | "PM") => {
    const formatted = `${parseInt(h, 10)}:${m} ${p}`;
    onChange(formatted);
  };

  const handleHourSelect = (h: string) => {
    setActiveSegment("minute");
    emitChange(h, parsed.minute, parsed.period);
  };

  const handleMinuteSelect = (m: string) => {
    setActiveSegment("period");
    emitChange(parsed.hour, m, parsed.period);
  };

  const handlePeriodSelect = (p: "AM" | "PM") => {
    setActiveSegment("period");
    emitChange(parsed.hour, parsed.minute, p);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Determine whether to open upward or downward
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === "top") {
        setOpenUpward(true);
      } else if (placement === "bottom") {
        setOpenUpward(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 250);
      }
    }
  }, [isOpen, placement]);

  // Scroll active hour and minute into center view when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const hourEl = hourListRef.current?.querySelector(`[data-selected="true"]`) as HTMLElement | null;
        if (hourEl && hourListRef.current) {
          const containerHeight = hourListRef.current.clientHeight;
          hourListRef.current.scrollTop =
            hourEl.offsetTop - hourListRef.current.offsetTop - containerHeight / 2 + hourEl.clientHeight / 2;
        }

        const minEl = minuteListRef.current?.querySelector(`[data-selected="true"]`) as HTMLElement | null;
        if (minEl && minuteListRef.current) {
          const containerHeight = minuteListRef.current.clientHeight;
          minuteListRef.current.scrollTop =
            minEl.offsetTop - minuteListRef.current.offsetTop - containerHeight / 2 + minEl.clientHeight / 2;
        }
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Time Display Trigger Box */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white transition cursor-pointer select-none ${
          hasError
            ? "border-rose-400 ring-2 ring-rose-400/20"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500"
            : "border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-semibold tracking-wider font-mono">
          <span
            onClick={(e) => {
              e.stopPropagation();
              setActiveSegment("hour");
              setIsOpen(true);
            }}
            className={`px-1.5 py-0.5 rounded transition ${
              isOpen && activeSegment === "hour"
                ? "bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-300 font-bold"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {parsed.hour}
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-bold">:</span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setActiveSegment("minute");
              setIsOpen(true);
            }}
            className={`px-1.5 py-0.5 rounded transition ${
              isOpen && activeSegment === "minute"
                ? "bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-300 font-bold"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {parsed.minute}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setActiveSegment("period");
              setIsOpen(true);
            }}
            className={`ml-2 px-1.5 py-0.5 rounded transition ${
              isOpen && activeSegment === "period"
                ? "bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-300 font-bold"
                : "text-slate-800 dark:text-slate-200 font-bold"
            }`}
          >
            {parsed.period}
          </span>
        </div>

        <Clock size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
      </button>

      {/* 3-Column Time Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 z-[999] bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 flex items-stretch select-none duration-150 ${
            openUpward
              ? "bottom-full mb-2 origin-bottom animate-in fade-in slide-in-from-bottom-2"
              : "top-full mt-2 origin-top animate-in fade-in slide-in-from-top-2"
          }`}
          style={{ width: "220px" }}
        >
          {/* Column 1: Hours */}
          <div
            ref={hourListRef}
            className="flex-1 h-52 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col space-y-1 px-1 py-1"
          >
            {HOURS.map((h) => {
              const isSelected = parsed.hour === h;
              return (
                <button
                  key={h}
                  type="button"
                  data-selected={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHourSelect(h);
                  }}
                  className={`w-full py-1.5 text-center text-xs sm:text-sm font-semibold rounded-md transition cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-[#0066fe] text-white font-bold shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {/* Subtle Vertical Divider */}
          <div className="w-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />

          {/* Column 2: Minutes */}
          <div
            ref={minuteListRef}
            className="flex-1 h-52 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col space-y-1 px-1 py-1"
          >
            {MINUTES.map((m) => {
              const isSelected = parsed.minute === m;
              return (
                <button
                  key={m}
                  type="button"
                  data-selected={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinuteSelect(m);
                  }}
                  className={`w-full py-1.5 text-center text-xs sm:text-sm font-semibold rounded-md transition cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-[#0066fe] text-white font-bold shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-[#bfdbfe] dark:hover:bg-blue-900/40 hover:text-blue-950 dark:hover:text-blue-100"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Subtle Vertical Divider */}
          <div className="w-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />

          {/* Column 3: AM / PM */}
          <div className="w-16 flex flex-col space-y-1.5 px-1 py-1 justify-start">
            {PERIODS.map((p) => {
              const isSelected = parsed.period === p;
              return (
                <button
                  key={p}
                  type="button"
                  data-selected={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePeriodSelect(p);
                  }}
                  className={`w-full py-2 text-center text-xs sm:text-sm font-bold rounded-md transition cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-[#0066fe] text-white shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
