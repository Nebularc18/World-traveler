import { MaterialCommunityIcons } from "@expo/vector-icons";
import { forwardRef, memo, useImperativeHandle } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemePreference } from "../hooks/useThemePreference";
import type { CountryStatusMap } from "../theme/types";

interface WorldMapProps {
  selectedCode: string | null;
  statuses: CountryStatusMap;
  onCountryPress: (code: string) => void;
  immersive?: boolean;
  showResetButton?: boolean;
}

export interface WorldMapHandle {
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

function WorldMapWebComponent(
  { immersive = false, showResetButton = true }: WorldMapProps,
  ref: React.ForwardedRef<WorldMapHandle>,
) {
  const { theme } = useThemePreference();

  useImperativeHandle(ref, () => ({
    reset: () => undefined,
    zoomIn: () => undefined,
    zoomOut: () => undefined,
  }));

  return (
    <View
      style={[
        styles.container,
        immersive ? styles.immersiveContainer : styles.card,
        {
          backgroundColor: theme.colors.mapOcean,
          borderColor: immersive ? "transparent" : theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>
        Native map preview is available in the iOS and Android app.
      </Text>

      {showResetButton ? (
        <Pressable
          accessibilityHint="No map reset is available on web"
          accessibilityLabel="Reset map view"
          accessibilityRole="button"
          accessible
          style={[
            styles.resetButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons color={theme.colors.textMuted} name="fit-to-screen-outline" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const ForwardedWorldMap = forwardRef(WorldMapWebComponent);
ForwardedWorldMap.displayName = "WorldMap";

export const WorldMap = memo(ForwardedWorldMap);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
    padding: 24,
    position: "relative",
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 360,
  },
  immersiveContainer: {
    borderRadius: 0,
    borderWidth: 0,
    minHeight: 0,
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    maxWidth: 320,
    textAlign: "center",
  },
  resetButton: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 20,
    width: 44,
  },
});
