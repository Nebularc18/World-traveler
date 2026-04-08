import type { ColorSchemeName } from "react-native";

export type CountryStatus = "unmarked" | "wishlisted" | "visited";
export type StoredCountryStatus = Exclude<CountryStatus, "unmarked">;
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedThemeName = Exclude<ThemePreference, "system">;

export type CountryStatusMap = Partial<Record<string, StoredCountryStatus>>;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  mapOcean: string;
  mapUnmarked: string;
  mapVisited: string;
  mapWishlisted: string;
  mapStroke: string;
  mapSelection: string;
  overlay: string;
  shadow: string;
}

export interface AppTheme {
  isDark: boolean;
  preference: ThemePreference;
  resolvedScheme: ResolvedThemeName;
  colors: ThemeColors;
}

export interface ThemeContextValue {
  theme: AppTheme;
  preference: ThemePreference;
  systemColorScheme: ColorSchemeName;
  setPreference: (value: ThemePreference) => Promise<void>;
}
