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
  const committedPreferenceRef = useRef<ThemePreference>("system");
  const mutationIdRef = useRef(0);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;
    const mountMutationId = mutationIdRef.current;

    const hydrationPromise = getStoredThemePreference()
      .then((storedPreference) => {
        committedPreferenceRef.current = storedPreference;

        const shouldApplyStoredPreference =
          isMounted &&
          mutationIdRef.current === mountMutationId &&
          preferenceRef.current === "system";

        if (shouldApplyStoredPreference) {
          preferenceRef.current = storedPreference;
          setPreferenceState(storedPreference);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });

    persistenceQueueRef.current = hydrationPromise;

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    preferenceRef.current = preference;
  }, [preference]);

  const handleSetPreference = useCallback(async (value: ThemePreference) => {
    const isInitialPreHydrationSelection = !isHydrated && mutationIdRef.current === 0;

    if (preferenceRef.current === value && !isInitialPreHydrationSelection) {
      return;
    }

    const nextMutationId = mutationIdRef.current + 1;

    mutationIdRef.current = nextMutationId;
    preferenceRef.current = value;
    setPreferenceState(value);

    const persistPromise = persistenceQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await persistThemePreference(value);
        committedPreferenceRef.current = value;
      });

    persistenceQueueRef.current = persistPromise;

    try {
      await persistPromise;
    } catch (error) {
      const shouldRollback =
        mutationIdRef.current === nextMutationId && preferenceRef.current === value;

      if (shouldRollback) {
        preferenceRef.current = committedPreferenceRef.current;
        setPreferenceState(committedPreferenceRef.current);
      }

      throw error;
    }
  }, [isHydrated]);

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
