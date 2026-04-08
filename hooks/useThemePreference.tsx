import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";

import {
  getThemePreference as getStoredThemePreference,
  setThemePreference as persistThemePreference,
} from "../storage/preferences";
import { resolveTheme } from "../theme";
import type { ThemeContextValue, ThemePreference } from "../theme/types";

const ThemePreferenceContext = createContext<ThemeContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isHydrated, setIsHydrated] = useState(false);
  const preferenceRef = useRef<ThemePreference>("system");
  const mutationIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    getStoredThemePreference()
      .then((storedPreference) => {
        if (isMounted) {
          preferenceRef.current = storedPreference;
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

  useEffect(() => {
    preferenceRef.current = preference;
  }, [preference]);

  const handleSetPreference = useCallback(async (value: ThemePreference) => {
    const previousPreference = preferenceRef.current;
    const nextMutationId = mutationIdRef.current + 1;

    mutationIdRef.current = nextMutationId;
    preferenceRef.current = value;
    setPreferenceState(value);

    try {
      await persistThemePreference(value);
    } catch (error) {
      const shouldRollback =
        mutationIdRef.current === nextMutationId && preferenceRef.current === value;

      if (shouldRollback) {
        preferenceRef.current = previousPreference;
        setPreferenceState(previousPreference);
      }

      throw error;
    }
  }, []);

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
