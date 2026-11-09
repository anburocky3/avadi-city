"use client";

import { useState } from "react";
import React from "react";
import { motion } from "framer-motion";
import { Badge, Modal } from "@/components/shared-components";
import { Check, Clock, CloudRain, CloudSun, CloudFog, Sun } from "lucide-react";

export interface HourlyForecast {
  time: string;
  rawHour: number;
  temp: string;
  desc: string;
  chanceOfRain: string;
  code: string;
}

export interface WeatherData {
  temp: string;
  desc: string;
  isHumid: boolean;
  code: string;
  hourly: HourlyForecast[];
  willRainToday: boolean;
  upcomingRain?: {
    time: string;
    chanceOfRain: string;
    desc: string;
  } | null;
}

interface WeatherOverlayProps {
  weather: WeatherData | null;
  isWeatherDetailsOpen: boolean;
  onWeatherDetailsClose: () => void;
  isRainAlertOpen: boolean;
  onRainAlertClose: () => void;
}

function renderHourlyIcon(code: string) {
  const numericCode = Number(code);
  if (numericCode === 113) {
    return <Sun size={18} className="text-amber-400 shrink-0" />;
  }
  if ([266, 296, 302, 308, 353, 356, 359, 389].includes(numericCode)) {
    return (
      <CloudRain
        size={18}
        className="text-blue-400 dark:text-blue-300 shrink-0"
      />
    );
  }
  if ([143, 248, 260].includes(numericCode)) {
    return <CloudFog size={18} className="text-slate-400 shrink-0" />;
  }
  return (
    <CloudSun
      size={18}
      className="text-amber-400 dark:text-amber-300 shrink-0"
    />
  );
}

export default function WeatherOverlay({
  weather,
  isWeatherDetailsOpen,
  onWeatherDetailsClose,
  isRainAlertOpen,
  onRainAlertClose,
}: WeatherOverlayProps) {
  const [showPastHours, setShowPastHours] = useState(false);
  const [currentHour] = useState(() => new Date().getHours());
  const code = Number(weather?.code);

  return (
    <>
      {code === 113 && (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-60">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-48 h-48 bg-amber-400/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute -top-4 -right-4 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"
          />
        </div>
      )}

      {[266, 296, 302, 308, 353, 356, 359, 389].includes(code) && (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-bl from-blue-900/10 to-transparent blur-md" />
          {[...Array(12)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ y: -50, x: index * 15, opacity: 0 }}
              animate={{ y: 200, opacity: [0, 0.8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.7,
                delay: (index % 5) * 0.15,
                ease: "linear",
              }}
              className="absolute top-0 w-0.5 h-8 bg-blue-400/40 dark:bg-blue-300/30 rotate-12"
              style={{ right: `${10 + index * 8}%` }}
            />
          ))}
        </div>
      )}

      {[143, 248, 260].includes(code) && (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
          <motion.div
            animate={{ x: [-20, 20, -20] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-full h-full bg-slate-300/30 dark:bg-slate-500/20 blur-2xl"
          />
          <motion.div
            animate={{ x: [20, -20, 20] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute bottom-0 right-10 w-3/4 h-3/4 bg-slate-200/20 dark:bg-slate-600/20 blur-3xl"
          />
        </div>
      )}

      {![113, 266, 296, 302, 308, 353, 356, 359, 389, 143, 248, 260].includes(
        code,
      ) && (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
          <motion.div
            animate={{ x: [-15, 15, -15] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute -top-4 right-10 w-40 h-24 bg-slate-300/20 dark:bg-slate-600/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{ x: [15, -15, 15] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
            className="absolute top-10 -right-5 w-48 h-20 bg-slate-200/20 dark:bg-slate-700/20 rounded-full blur-2xl"
          />
        </div>
      )}

      <Modal
        isOpen={isWeatherDetailsOpen}
        onClose={onWeatherDetailsClose}
        title="Today's Hourly Forecast"
      >
        <div className="space-y-3">
          {weather?.hourly && weather.hourly.length > 0 ? (
            (() => {
              const hasPastHours = weather.hourly.some(
                (hour) => hour.rawHour + 3 <= currentHour,
              );
              const displayHourly = weather.hourly.filter(
                (hour) => showPastHours || hour.rawHour + 3 > currentHour,
              );

              return (
                <>
                  {hasPastHours && (
                    <div className="flex justify-end pb-1">
                      <button
                        type="button"
                        onClick={() => setShowPastHours((visible) => !visible)}
                        className="text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        {showPastHours
                          ? "Hide past hours"
                          : "Show earlier hours today"}
                      </button>
                    </div>
                  )}
                  {displayHourly.length > 0 ? (
                    displayHourly.map((hour) => {
                      const highChance = Number(hour.chanceOfRain) >= 40;
                      return (
                        <div
                          key={`${hour.rawHour}-${hour.time}`}
                          className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl transition shadow-xs"
                        >
                          <div className="flex items-center gap-3 w-28 shrink-0">
                            <Clock size={14} className="text-slate-400" />
                            <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                              {hour.time}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col pl-2 text-xs sm:text-sm truncate">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                              {hour.desc}
                            </span>
                            {Number(hour.chanceOfRain) > 20 && (
                              <span
                                className={`text-[11px] font-black mt-0.5 ${highChance ? "text-blue-600 dark:text-blue-400" : "text-blue-400 dark:text-blue-300/80"}`}
                              >
                                ☔ {hour.chanceOfRain}% Chance of Rain
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 shrink-0 pl-2">
                            {renderHourlyIcon(hour.code)}
                            <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                              {hour.temp}°C
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs font-bold text-slate-500">
                      No remaining forecast hours for today.
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            <div className="p-4 text-center text-sm font-bold text-slate-500">
              Loading forecast...
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onWeatherDetailsClose}
          className="w-full mt-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-sm"
        >
          Close Forecast
        </button>
      </Modal>

      <Modal
        isOpen={isRainAlertOpen}
        onClose={onRainAlertClose}
        title="Weather Advisory"
      >
        <div className="space-y-4 text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse shadow-inner border border-blue-500/20">
              <CloudRain size={32} />
            </div>
          </div>
          <Badge
            variant="info"
            className="uppercase font-black tracking-widest text-[10px]"
          >
            Rain Forecasted Ahead
          </Badge>
          <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
            Scattered Showers Expected
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            {weather?.upcomingRain ? (
              <>
                Showers are forecasted around{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {weather.upcomingRain.time}
                </span>{" "}
                ({weather.upcomingRain.chanceOfRain}% chance) in Avadi. Please
                remember to carry an umbrella or a raincoat if you are stepping
                out.
              </>
            ) : (
              <>
                Upcoming showers are forecasted for Avadi later today. Please
                remember to carry an umbrella or a raincoat if you are stepping
                out.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onRainAlertClose}
            className="w-full mt-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Check size={14} />
            <span>Okay, thanks!</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
