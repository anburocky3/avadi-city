import { format12Hour, getChennaiClockTime } from "@/utils/helper";
import { useState } from "react";

type AnalogClockProps = {
  clockTime: Date;
  currentTimeStr: string;
} & React.ComponentPropsWithoutRef<"div">; // Extends all standard div attributes

export default function AnalogClock({
  clockTime,
  currentTimeStr,
  ...rest
}: AnalogClockProps) {
  const chennaiTime = getChennaiClockTime(clockTime);
  const elapsedMinutes = chennaiTime.hours * 60 + chennaiTime.minutes;
  const elapsedSeconds = elapsedMinutes * 60 + chennaiTime.seconds;
  return (
    <div className="flex items-center gap-2.5" {...rest}>
      <svg
        viewBox="0 0 96 96"
        role="img"
        aria-label={`Chennai Central local time: ${format12Hour(currentTimeStr)}`}
        className="size-24 shrink-0 rounded-full"
      >
        <circle cx="48" cy="48" r="43" fill="rgba(255,255,255,0.92)" />
        {Array.from({ length: 60 }, (_, tick) => (
          <line
            key={tick}
            x1="48"
            y1={tick % 5 === 0 ? "9" : "10"}
            x2="48"
            y2={tick % 5 === 0 ? "15" : "12"}
            stroke={tick % 5 === 0 ? "#7c2d12" : "#fdba74"}
            strokeWidth={tick % 5 === 0 ? "2" : "1"}
            transform={`rotate(${tick * 6} 48 48)`}
          />
        ))}
        {[12, 3, 6, 9].map((number, index) => {
          const positions = [
            { x: 48, y: 25 },
            { x: 71, y: 51 },
            { x: 48, y: 75 },
            { x: 25, y: 51 },
          ];
          return (
            <text
              key={number}
              x={positions[index].x}
              y={positions[index].y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-orange-950 text-[8px] font-black"
            >
              {number}
            </text>
          );
        })}
        <g
          transform={`rotate(${elapsedMinutes / 2} 48 48)`}
          className="transition-transform duration-1000 ease-linear"
        >
          <line
            x1="48"
            y1="50"
            x2="48"
            y2="31"
            stroke="#7c2d12"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <g
          transform={`rotate(${elapsedMinutes * 6} 48 48)`}
          className="transition-transform duration-1000 ease-linear"
        >
          <line
            x1="48"
            y1="51"
            x2="48"
            y2="20"
            stroke="#9a3412"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <g
          transform={`rotate(${elapsedSeconds * 6} 48 48)`}
          className="transition-transform duration-1000 ease-linear"
        >
          <line
            x1="48"
            y1="56"
            x2="48"
            y2="15"
            stroke="#ea580c"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </g>
        <circle cx="48" cy="48" r="2.5" fill="#7c2d12" />
      </svg>
    </div>
  );
}
