import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ThemePreference } from "../theme/types";

const THEME_PREFERENCE_KEY = "world-traveler/theme-preference";

export async function getThemePreference(): Promise<ThemePreference> {
  let value: string | null;

  try {
    value = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  } catch {
    return "system";
  }

  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export async function setThemePreference(value: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, value);
  } catch {
    throw new Error("Failed to persist theme preference.");
  }
}
