import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CountryStatusMap } from "../theme/types";

const COUNTRY_STATUSES_KEY = "world-traveler/country-statuses";

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
    const parsed = JSON.parse(value) as CountryStatusMap;
    return parsed ?? {};
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
