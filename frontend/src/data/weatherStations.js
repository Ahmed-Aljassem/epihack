/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Define Arizona weather locations and fallback conditions used
by the public landing page's live situation panel.
*/

export const ARIZONA_WEATHER_LOCATIONS = Object.freeze([
  {
    id: "phoenix",
    label: "Phoenix",
    county: "Maricopa",
    latitude: 33.4484,
    longitude: -112.074,
  },
  {
    id: "tucson",
    label: "Tucson",
    county: "Pima",
    latitude: 32.2226,
    longitude: -110.9747,
  },
  {
    id: "yuma",
    label: "Yuma",
    county: "Yuma",
    latitude: 32.6927,
    longitude: -114.6277,
  },
]);

export const ARIZONA_WEATHER_FALLBACK = Object.freeze({
  capturedAt: "Demo snapshot",
  observations: [
    {
      id: "phoenix",
      label: "Phoenix",
      county: "Maricopa",
      temperatureF: 99,
      feelsLikeF: 103,
      humidity: 19,
      windMph: 9,
      highF: 104,
      lowF: 80,
      uvMax: 9,
      condition: "Sunny",
      weatherCode: 0,
    },
    {
      id: "tucson",
      label: "Tucson",
      county: "Pima",
      temperatureF: 94,
      feelsLikeF: 97,
      humidity: 23,
      windMph: 10,
      highF: 100,
      lowF: 74,
      uvMax: 8,
      condition: "Mostly sunny",
      weatherCode: 1,
    },
    {
      id: "yuma",
      label: "Yuma",
      county: "Yuma",
      temperatureF: 102,
      feelsLikeF: 106,
      humidity: 14,
      windMph: 11,
      highF: 108,
      lowF: 79,
      uvMax: 10,
      condition: "Clear",
      weatherCode: 0,
    },
  ],
});
