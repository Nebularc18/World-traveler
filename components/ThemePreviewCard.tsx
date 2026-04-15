import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemePreference } from "../hooks/useThemePreference";
import { resolveTheme } from "../theme";
import type { ThemePreference } from "../theme/types";

interface ThemePreviewCardProps {
  title: string;
  description: string;
  value: ThemePreference;
  selected: boolean;
  onPress: (value: ThemePreference) => Promise<void>;
}

export function ThemePreviewCard({
  title,
  description,
  value,
  selected,
  onPress,
}: ThemePreviewCardProps) {
  const { systemColorScheme, theme } = useThemePreference();
  const previewTheme = resolveTheme(value, systemColorScheme);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        onPress(value).catch(() => {
          console.warn("Failed to update theme preference.");
        });
      }}
      style={[
        styles.card,
        {
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.card,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
        </View>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? theme.colors.primary : theme.colors.borderStrong,
              backgroundColor: selected ? theme.colors.primary : "transparent",
            },
          ]}
        />
      </View>
      <View style={styles.previewRow}>
        <View style={[styles.previewSwatch, { backgroundColor: previewTheme.colors.background }]} />
        <View style={[styles.previewSwatch, { backgroundColor: previewTheme.colors.surface }]} />
        <View style={[styles.previewSwatch, { backgroundColor: previewTheme.colors.mapVisited }]} />
        <View style={[styles.previewSwatch, { backgroundColor: previewTheme.colors.mapWishlisted }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 18,
    padding: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  radio: {
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewSwatch: {
    borderRadius: 14,
    flex: 1,
    height: 42,
  },
});
