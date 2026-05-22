/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Fetch practical Arizona weather context for the public map
panel, with fallback demo conditions when live weather is unavailable.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ARIZONA_WEATHER_FALLBACK,
  ARIZONA_WEATHER_LOCATIONS,
} from "../data/weatherStations";

const WEATHER_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const WEATHER_REFRESH_MS = 10 * 60 * 1000;

export function useArizonaWeather() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const refresh = useCallback(async () => {
    let liveRows = [];
    setError(null);

    try {
      liveRows = await Promise.all(
        ARIZONA_WEATHER_LOCATIONS.map((location) => fetchLocationWeather(location)),
      );
    } catch (err) {
      liveRows = [];
      setError(err);
    }

    if (liveRows.length) {
      setObservations(liveRows);
      setUpdatedAt(new Date());
      setUsingFallback(false);
    } else {
      setObservations(ARIZONA_WEATHER_FALLBACK.observations);
      setUpdatedAt(ARIZONA_WEATHER_FALLBACK.capturedAt);
      setUsingFallback(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(refresh, WEATHER_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const summary = useMemo(() => {
    return buildWeatherSummary(observations);
  }, [observations]);

  return {
    observations,
    summary,
    loading,
    error,
    updatedAt,
    usingFallback,
    refresh,
  };
}

async function fetchLocationWeather(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "weather_code",
    ].join(","),
    daily: ["temperature_2m_max", "temperature_2m_min", "uv_index_max"].join(","),
    forecast_days: "1",
    timezone: "America/Phoenix",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
  });

  const response = await fetch(`${WEATHER_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather API HTTP ${response.status}`);
  }

  const payload = await response.json();
  const current = payload.current || {};
  const daily = payload.daily || {};

  return {
    id: location.id,
    label: location.label,
    county: location.county,
    temperatureF: safeRound(current.temperature_2m),
    feelsLikeF: safeRound(current.apparent_temperature),
    humidity: safeRound(current.relative_humidity_2m),
    windMph: safeRound(current.wind_speed_10m),
    highF: safeRound(daily.temperature_2m_max?.[0]),
    lowF: safeRound(daily.temperature_2m_min?.[0]),
    uvMax: safeRound(daily.uv_index_max?.[0]),
    condition: weatherLabel(current.weather_code),
    weatherCode: current.weather_code,
  };
}

function buildWeatherSummary(observations) {
  if (!observations.length) {
    return {
      hottest: null,
      statewideAvgF: null,
      maxUv: null,
      heatRisk: "Moderate",
      guidance: "Weather data is loading.",
    };
  }

  const hottest = [...observations].sort((a, b) => b.temperatureF - a.temperatureF)[0];
  const statewideAvgF = safeRound(
    observations.reduce((sum, item) => sum + item.temperatureF, 0) / observations.length,
  );
  const maxUv = Math.max(...observations.map((item) => Number(item.uvMax || 0)));
  const maxFeelsLike = Math.max(...observations.map((item) => Number(item.feelsLikeF || 0)));
  const heatRisk = classifyHeatRisk(maxFeelsLike, maxUv);

  return {
    hottest,
    statewideAvgF,
    maxUv,
    heatRisk,
    guidance: heatGuidance(heatRisk),
  };
}

function classifyHeatRisk(feelsLikeF, uvMax) {
  if (feelsLikeF >= 108 || uvMax >= 10) return "Extreme";
  if (feelsLikeF >= 100 || uvMax >= 8) return "High";
  if (feelsLikeF >= 92 || uvMax >= 6) return "Elevated";
  return "Moderate";
}

function heatGuidance(risk) {
  if (risk === "Extreme") {
    return "Extreme heat risk today. Limit midday outdoor activity and route hydration support early.";
  }
  if (risk === "High") {
    return "High heat risk. Focus checks on outdoor workers, unhoused populations, and event sites.";
  }
  if (risk === "Elevated") {
    return "Elevated heat conditions. Encourage hydration and monitor for early heat-related symptoms.";
  }
  return "Moderate conditions today with routine monitoring across the state.";
}

function weatherLabel(code) {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Mixed conditions";
}

function safeRound(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number);
}
