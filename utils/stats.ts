import { CONTINENT_ORDER } from "../data/continents";
import type { CountryRecord } from "../data/countries";
import type { CountryStatusMap } from "../theme/types";

export interface ContinentBreakdown {
  continent: (typeof CONTINENT_ORDER)[number];
  totalCountries: number;
  visitedCount: number;
  wishlistedCount: number;
}

export interface TravelStats {
  totalCountries: number;
  visitedCount: number;
  visitedPercentage: number;
  wishlistedCount: number;
  wishlistedPercentage: number;
  totalContinents: number;
  visitedContinentCount: number;
  visitedContinentPercentage: number;
  wishlistedContinentCount: number;
  wishlistedContinentPercentage: number;
  breakdown: ContinentBreakdown[];
}

export function calculateTravelStats(countries: CountryRecord[], statuses: CountryStatusMap): TravelStats {
  const breakdown = CONTINENT_ORDER.map((continent) => ({
    continent,
    totalCountries: 0,
    visitedCount: 0,
    wishlistedCount: 0,
  }));

  const continentIndex = Object.fromEntries(
    breakdown.map((item, index) => [item.continent, index]),
  ) as Record<(typeof CONTINENT_ORDER)[number], number>;

  let visitedCount = 0;
  let wishlistedCount = 0;

  for (const country of countries) {
    const continentStats = breakdown[continentIndex[country.continent]];
    continentStats.totalCountries += 1;

    const status = statuses[country.code];

    if (status === "visited") {
      visitedCount += 1;
      continentStats.visitedCount += 1;
    }

    if (status === "wishlisted") {
      wishlistedCount += 1;
      continentStats.wishlistedCount += 1;
    }
  }

  const totalCountries = countries.length;
  const totalContinents = breakdown.length;
  const visitedContinentCount = breakdown.filter((item) => item.visitedCount > 0).length;
  const wishlistedContinentCount = breakdown.filter((item) => item.wishlistedCount > 0).length;

  return {
    totalCountries,
    visitedCount,
    visitedPercentage: percentage(visitedCount, totalCountries),
    wishlistedCount,
    wishlistedPercentage: percentage(wishlistedCount, totalCountries),
    totalContinents,
    visitedContinentCount,
    visitedContinentPercentage: percentage(visitedContinentCount, totalContinents),
    wishlistedContinentCount,
    wishlistedContinentPercentage: percentage(wishlistedContinentCount, totalContinents),
    breakdown,
  };
}

export function percentage(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Number(((value / total) * 100).toFixed(1));
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}
