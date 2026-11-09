"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  HourlyForecast,
  WeatherData,
} from "@/features/dashboard/components/weather-overlay";

const WEATHER_CACHE_KEY = "avadi_weather_data";
const WEATHER_DISMISSED_KEY = "avadi_weather_alert_dismissed_date";

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTime(value: string) {
  const hour = Number.parseInt(value, 10) / 100;
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${formattedHour}:00 ${suffix}`;
}

function fallbackWeather(currentHour: number): WeatherData {
  const hourly: HourlyForecast[] = [
    {
      time: "9:00 AM",
      rawHour: 9,
      temp: "30",
      desc: "Cloudy",
      chanceOfRain: "10",
      code: "119",
    },
    {
      time: "12:00 PM",
      rawHour: 12,
      temp: "33",
      desc: "Sunny",
      chanceOfRain: "10",
      code: "113",
    },
    {
      time: "3:00 PM",
      rawHour: 15,
      temp: "34",
      desc: "Scattered Thunderstorms",
      chanceOfRain: "50",
      code: "389",
    },
    {
      time: "6:00 PM",
      rawHour: 18,
      temp: "31",
      desc: "Rain",
      chanceOfRain: "80",
      code: "356",
    },
  ];
  const upcomingRain = hourly.find(
    (hour) => hour.rawHour + 3 > currentHour && Number(hour.chanceOfRain) >= 40,
  );
  return {
    temp: "32",
    desc: "CLOUDY",
    isHumid: true,
    code: "119",
    hourly,
    willRainToday: Boolean(upcomingRain),
    upcomingRain: upcomingRain
      ? {
          time: upcomingRain.time,
          chanceOfRain: upcomingRain.chanceOfRain,
          desc: upcomingRain.desc,
        }
      : null,
  };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isRainAlertOpen, setIsRainAlertOpen] = useState(false);

  const refreshWeather = useCallback(async (force = false) => {
    const now = Date.now();
    const currentHour = new Date().getHours();
    try {
      if (!force) {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            timestamp: number;
            data: WeatherData;
          };
          if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setWeather(parsed.data);
            const hasRain = parsed.data.hourly.some(
              (hour) =>
                hour.rawHour + 3 > currentHour &&
                Number(hour.chanceOfRain) >= 40,
            );
            setIsRainAlertOpen(
              hasRain &&
                localStorage.getItem(WEATHER_DISMISSED_KEY) !== todayKey(),
            );
            return;
          }
        }
      }

      const response = await fetch("https://wttr.in/Avadi?format=j1");
      if (!response.ok) throw new Error("Weather service unavailable");
      const data = await response.json();
      const current = data.current_condition[0];
      const hourly: HourlyForecast[] = data.weather[0].hourly.map(
        (hour: any) => ({
          time: formatTime(hour.time),
          rawHour: Number.parseInt(hour.time, 10) / 100,
          temp: hour.tempC,
          desc: hour.weatherDesc[0].value,
          chanceOfRain: hour.chanceofrain,
          code: hour.weatherCode,
        }),
      );
      const upcomingRain = hourly.find(
        (hour) =>
          hour.rawHour + 3 > currentHour && Number(hour.chanceOfRain) >= 40,
      );
      const nextWeather: WeatherData = {
        temp: current.temp_C,
        desc: current.weatherDesc[0].value.toUpperCase(),
        isHumid: Number(current.humidity) > 60,
        code: current.weatherCode,
        hourly,
        willRainToday: hourly.some((hour) => Number(hour.chanceOfRain) >= 40),
        upcomingRain: upcomingRain
          ? {
              time: upcomingRain.time,
              chanceOfRain: upcomingRain.chanceOfRain,
              desc: upcomingRain.desc,
            }
          : null,
      };
      localStorage.setItem(
        WEATHER_CACHE_KEY,
        JSON.stringify({ timestamp: now, data: nextWeather }),
      );
      setWeather(nextWeather);
      setIsRainAlertOpen(
        Boolean(upcomingRain) &&
          localStorage.getItem(WEATHER_DISMISSED_KEY) !== todayKey(),
      );
    } catch (error) {
      console.warn("Weather fetch fallback:", error);
      const fallback = fallbackWeather(currentHour);
      setWeather(fallback);
      setIsRainAlertOpen(Boolean(fallback.upcomingRain));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refreshWeather());
  }, [refreshWeather]);

  const dismissRainAlert = useCallback(() => {
    localStorage.setItem(WEATHER_DISMISSED_KEY, todayKey());
    setIsRainAlertOpen(false);
  }, []);

  return { weather, refreshWeather, isRainAlertOpen, dismissRainAlert };
}
