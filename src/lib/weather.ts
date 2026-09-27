// Weather data from Open-Meteo (free, no API key): https://open-meteo.com

export type WeatherGroup = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";
export type Advisory = { kind: "rain" | "high" | "moderate" | "low"; rainMm: number; et0: number };

export type WeatherData = {
  current: { temperature: number; humidity: number; wind: number; precipitation: number; group: WeatherGroup };
  daily: { date: string; max: number; min: number; rain: number; et0: number; group: WeatherGroup }[];
  advisory: Advisory;
};

export function weatherGroup(code: number): WeatherGroup {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

/**
 * Simple, explainable irrigation rule based on FAO reference evapotranspiration (ET₀):
 *  - ≥ 5 mm rain expected in 48h → postpone
 *  - ET₀ ≥ 6 mm/day → high demand, ≥ 3 → moderate, otherwise low
 */
export function irrigationAdvisory(rainNext48h: number, et0Today: number): Advisory {
  const rainMm = Math.round(rainNext48h * 10) / 10;
  const et0 = Math.round(et0Today * 10) / 10;
  if (rainNext48h >= 5) return { kind: "rain", rainMm, et0 };
  if (et0Today >= 6) return { kind: "high", rainMm, et0 };
  if (et0Today >= 3) return { kind: "moderate", rainMm, et0 };
  return { kind: "low", rainMm, et0 };
}

type ForecastResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    et0_fao_evapotranspiration: number[];
  };
};

export async function getWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
    timezone: "auto",
    forecast_days: "5",
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ForecastResponse;
    const d = json.daily;

    const daily = d.time.map((date, i) => ({
      date,
      max: Math.round(d.temperature_2m_max[i]),
      min: Math.round(d.temperature_2m_min[i]),
      rain: d.precipitation_sum[i] ?? 0,
      et0: d.et0_fao_evapotranspiration[i] ?? 0,
      group: weatherGroup(d.weather_code[i]),
    }));

    return {
      current: {
        temperature: Math.round(json.current.temperature_2m),
        humidity: Math.round(json.current.relative_humidity_2m),
        wind: Math.round(json.current.wind_speed_10m),
        precipitation: json.current.precipitation,
        group: weatherGroup(json.current.weather_code),
      },
      daily,
      advisory: irrigationAdvisory((daily[0]?.rain ?? 0) + (daily[1]?.rain ?? 0), daily[0]?.et0 ?? 0),
    };
  } catch {
    return null;
  }
}

/** Resolve a place name (Arabic or English) to coordinates. Returns null when nothing is found. */
export async function geocode(query: string, language: string): Promise<{ latitude: number; longitude: number } | null> {
  const candidates = [query, query.split(/[,،-]/)[0]].map((q) => q.trim()).filter(Boolean);

  for (const name of new Set(candidates)) {
    try {
      const params = new URLSearchParams({ name, count: "1", language, format: "json" });
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { results?: { latitude: number; longitude: number }[] };
      const hit = json.results?.[0];
      if (hit) return { latitude: Number(hit.latitude.toFixed(6)), longitude: Number(hit.longitude.toFixed(6)) };
    } catch {
      // network error / timeout — try next candidate
    }
  }
  return null;
}
