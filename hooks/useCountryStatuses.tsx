import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getStoredCountryStatuses, setStoredCountryStatuses } from "../storage/countryStatusStorage";
import type { CountryStatus, CountryStatusMap, StoredCountryStatus } from "../theme/types";

interface CountryStatusesContextValue {
  statuses: CountryStatusMap;
  isHydrated: boolean;
  setCountryStatus: (code: string, status: CountryStatus) => Promise<void>;
  getCountryStatus: (code: string) => CountryStatus;
}

const CountryStatusesContext = createContext<CountryStatusesContextValue | null>(null);

export function CountryStatusesProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<CountryStatusMap>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getStoredCountryStatuses()
      .then((storedStatuses) => {
        if (isMounted) {
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

  const value = useMemo<CountryStatusesContextValue>(
    () => ({
      statuses,
      isHydrated,
      async setCountryStatus(code, status) {
        const nextStatuses = { ...statuses };

        if (status === "unmarked") {
          delete nextStatuses[code];
        } else {
          nextStatuses[code] = status as StoredCountryStatus;
        }

        setStatuses(nextStatuses);
        await setStoredCountryStatuses(nextStatuses);
      },
      getCountryStatus(code) {
        return statuses[code] ?? "unmarked";
      },
    }),
    [isHydrated, statuses],
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
