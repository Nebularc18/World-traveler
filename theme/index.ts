import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from "@react-navigation/native";

import { darkColors, lightColors } from "./colors";
import type { AppTheme, ResolvedThemeName, ThemePreference } from "./types";

export const lightTheme: AppTheme = {
  isDark: false,
  preference: "light",
  resolvedScheme: "light",
  colors: lightColors,
};

export const darkTheme: AppTheme = {
  isDark: true,
  preference: "dark",
  resolvedScheme: "dark",
  colors: darkColors,
};

export function resolveTheme(preference: ThemePreference, systemColorScheme: string | null | undefined): AppTheme {
  const resolvedScheme: ResolvedThemeName =
    preference === "system" ? (systemColorScheme === "dark" ? "dark" : "light") : preference;

  const baseTheme = resolvedScheme === "dark" ? darkTheme : lightTheme;

  return {
    ...baseTheme,
    preference,
    resolvedScheme,
  };
}

export function toNavigationTheme(theme: AppTheme) {
  const base = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };
}
