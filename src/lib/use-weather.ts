"use client";

import { useEffect, useState } from "react";
import { getWeather, type WeatherData } from "./weather";

// One request per location per page load, shared by every component that needs it.
const cache = new Map<string, Promise<WeatherData | null>>();

/** Live weather for a location, fetched in the browser from Open-Meteo. */
export function useWeather(latitude: number | null | undefined, longitude: number | null | undefined) {
  const key = latitude != null && longitude != null ? `${latitude},${longitude}` : null;
  const [result, setResult] = useState<{ key: string; data: WeatherData | null } | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    if (!cache.has(key)) cache.set(key, getWeather(Number(latitude), Number(longitude)));
    cache.get(key)!.then((data) => {
      if (active) setResult({ key, data });
    });
    return () => {
      active = false;
    };
  }, [key, latitude, longitude]);

  const ready = key !== null && result?.key === key;
  return { loading: key !== null && !ready, data: ready ? result.data : null };
}
