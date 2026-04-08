import { StyleSheet, Text, View } from "react-native";

import { useThemePreference } from "../hooks/useThemePreference";

const legendItems = [
  { label: "Visited", colorKey: "mapVisited" as const },
  { label: "Wishlist", colorKey: "mapWishlisted" as const },
  { label: "Unmarked", colorKey: "mapUnmarked" as const },
];

export function MapLegend() {
  const { theme } = useThemePreference();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {legendItems.map((item) => (
        <View key={item.label} style={styles.item}>
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: theme.colors[item.colorKey],
                borderColor: theme.colors.mapStroke,
              },
            ]}
          />
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  swatch: {
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
