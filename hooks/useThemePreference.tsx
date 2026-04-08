import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import {
  getThemePreference as getStoredThemePreference,
  setThemePreference as persistThemePreference,
} from "../storage/preferences";
import { resolveTheme } from "../theme";
import type { ThemeContextValue, ThemePreference } from "../theme/types";

const ThemePreferenceContext = createContext<ThemeContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getStoredThemePreference()
      .then((storedPreference) => {
        if (isMounted) {
          setPreferenceState(storedPreference);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetPreference = useCallback(async (value: ThemePreference) => {
    const previousPreference = preference;
    setPreferenceState(value);

    try {
      await persistThemePreference(value);
    } catch (error) {
      setPreferenceState(previousPreference);
      throw error;
    }
  }, [preference]);

  const theme = useMemo(
    () => resolveTheme(preference, systemColorScheme),
    [preference, systemColorScheme],
  );

  const value = useMemo(
    () => ({
      isHydrated,
      theme,
      preference,
      systemColorScheme,
      setPreference: handleSetPreference,
    }),
    [handleSetPreference, isHydrated, preference, systemColorScheme, theme],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error("useThemePreference must be used inside ThemePreferenceProvider");
  }

  return context;
}
