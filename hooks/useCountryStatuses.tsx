import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getStoredCountryStatuses, setStoredCountryStatuses } from "../storage/countryStatusStorage";
import type { CountryStatus, CountryStatusMap, StoredCountryStatus } from "../theme/types";

interface CountryStatusesContextValue {
  statuses: CountryStatusMap;
  isHydrated: boolean;
  setCountryStatus: (code: string, status: CountryStatus) => Promise<void>;
  getCountryStatus: (code: string) => CountryStatus;
}

const CountryStatusesContext = createContext<CountryStatusesContextValue | null>(null);

export function CountryStatusesProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<CountryStatusMap>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const statusesRef = useRef<CountryStatusMap>({});
  const committedStatusesRef = useRef<CountryStatusMap>({});
  const mutationIdRef = useRef(0);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    getStoredCountryStatuses()
      .then((storedStatuses) => {
        if (isMounted) {
          statusesRef.current = storedStatuses;
          committedStatusesRef.current = storedStatuses;
          setStatuses(storedStatuses);
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
    statusesRef.current = statuses;
  }, [statuses]);

  const setCountryStatus = useCallback(async (code: string, status: CountryStatus) => {
    const nextStatuses = { ...statusesRef.current };
    const nextMutationId = mutationIdRef.current + 1;

    mutationIdRef.current = nextMutationId;

    if (status === "unmarked") {
      delete nextStatuses[code];
    } else {
      nextStatuses[code] = status as StoredCountryStatus;
    }

    statusesRef.current = nextStatuses;
    setStatuses(nextStatuses);

    const persistPromise = persistenceQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await setStoredCountryStatuses(nextStatuses);
        committedStatusesRef.current = nextStatuses;
      });

    persistenceQueueRef.current = persistPromise;

    try {
      await persistPromise;
    } catch (error) {
      const shouldRollback =
        mutationIdRef.current === nextMutationId && statusesRef.current === nextStatuses;

      if (shouldRollback) {
        statusesRef.current = committedStatusesRef.current;
        setStatuses(committedStatusesRef.current);
      }

      throw error;
    }
  }, []);

  const getCountryStatus = useCallback(
    (code: string) => statusesRef.current[code] ?? "unmarked",
    [],
  );

  const value = useMemo<CountryStatusesContextValue>(
    () => ({
      statuses,
      isHydrated,
      setCountryStatus,
      getCountryStatus,
    }),
    [getCountryStatus, isHydrated, setCountryStatus, statuses],
  );

  return <CountryStatusesContext.Provider value={value}>{children}</CountryStatusesContext.Provider>;
}

export function useCountryStatuses() {
  const context = useContext(CountryStatusesContext);

  if (!context) {
    throw new Error("useCountryStatuses must be used inside CountryStatusesProvider");
  }

  return context;
}
