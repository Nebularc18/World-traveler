import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CountryStatusMap } from "../theme/types";

const COUNTRY_STATUSES_KEY = "world-traveler/country-statuses";
const VALID_COUNTRY_STATUSES = new Set(["visited", "wishlisted"]);

function sanitizeCountryStatusMap(value: unknown): CountryStatusMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const sanitizedEntries = Object.entries(value).filter(([code, status]) => {
    return typeof code === "string" && VALID_COUNTRY_STATUSES.has(String(status));
  });

  return Object.fromEntries(sanitizedEntries);
}

export async function getStoredCountryStatuses(): Promise<CountryStatusMap> {
  let value: string | null;

  try {
    value = await AsyncStorage.getItem(COUNTRY_STATUSES_KEY);
  } catch {
    return {};
  }

  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return sanitizeCountryStatusMap(parsed);
  } catch {
    return {};
  }
}

export async function setStoredCountryStatuses(value: CountryStatusMap): Promise<void> {
  try {
    await AsyncStorage.setItem(COUNTRY_STATUSES_KEY, JSON.stringify(value));
  } catch {
    throw new Error("Failed to persist country statuses.");
  }
}
