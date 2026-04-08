import { countriesByCode } from "../data/countries";
import type { AppTheme, CountryStatus } from "../theme/types";

export function getCountryByCode(code: string | null | undefined) {
  if (!code) {
    return null;
  }

  return countriesByCode[code] ?? null;
}

export function getCountryStatusLabel(status: CountryStatus): string {
  switch (status) {
    case "visited":
      return "Visited";
    case "wishlisted":
      return "Wishlisted";
    default:
      return "Unmarked";
  }
}

export function getCountryStatusColor(theme: AppTheme, status: CountryStatus): string {
  switch (status) {
    case "visited":
      return theme.colors.mapVisited;
    case "wishlisted":
      return theme.colors.mapWishlisted;
    default:
      return theme.colors.mapUnmarked;
  }
}
