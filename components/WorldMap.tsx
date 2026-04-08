import { MaterialCommunityIcons } from "@expo/vector-icons";
import { forwardRef, memo, useImperativeHandle, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Svg, { G, Path, Rect } from "react-native-svg";
import Animated, { clamp, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { WORLD_MAP_COUNTRIES, WORLD_MAP_VIEWBOX } from "../data/worldMap";
import { useThemePreference } from "../hooks/useThemePreference";
import { getCountryStatusColor } from "../utils/countryHelpers";
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

interface LayoutMetrics {
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  stripWidth: number;
  contentLeft: number;
}

const MAX_SCALE = 6;
const MAP_ASPECT_RATIO = WORLD_MAP_VIEWBOX.width / WORLD_MAP_VIEWBOX.height;
const MAP_COUNTRIES = (() => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const uniqueCountries = [];

  for (const country of WORLD_MAP_COUNTRIES) {
    if (seen.has(country.code)) {
      duplicates.push(country.code);
      continue;
    }

    seen.add(country.code);
    uniqueCountries.push(country);
  }

  if (__DEV__ && duplicates.length > 0) {
    console.warn(`Duplicate world map country codes skipped: ${duplicates.join(", ")}`);
  }

  return uniqueCountries;
})();

function buildLayoutMetrics(width: number, height: number, immersive: boolean): LayoutMetrics {
  if (immersive) {
    const worldHeight = height;
    const worldWidth = worldHeight * MAP_ASPECT_RATIO;

    return {
      viewportWidth: width,
      viewportHeight: height,
      worldWidth,
      worldHeight,
      stripWidth: worldWidth * 3,
      contentLeft: -worldWidth,
    };
  }

  const fitScale = Math.min(width / WORLD_MAP_VIEWBOX.width, height / WORLD_MAP_VIEWBOX.height);
  const worldWidth = WORLD_MAP_VIEWBOX.width * fitScale;
  const worldHeight = WORLD_MAP_VIEWBOX.height * fitScale;

  return {
    viewportWidth: width,
    viewportHeight: height,
    worldWidth,
    worldHeight,
    stripWidth: worldWidth,
    contentLeft: (width - worldWidth) / 2,
  };
}

function clampVerticalTranslation(
  value: number,
  zoomScale: number,
  viewportHeight: number,
  worldHeight: number,
) {
  "worklet";

  if (viewportHeight === 0 || worldHeight === 0) {
    return 0;
  }

  const overflow = Math.max(0, (worldHeight * zoomScale - viewportHeight) / 2);
  return clamp(value, -overflow, overflow);
}

function clampHorizontalTranslation(
  value: number,
  zoomScale: number,
  viewportWidth: number,
  worldWidth: number,
) {
  "worklet";

  if (viewportWidth === 0 || worldWidth === 0) {
    return 0;
  }

  const overflow = Math.max(0, (worldWidth * zoomScale - viewportWidth) / 2);
  return clamp(value, -overflow, overflow);
}

function wrapHorizontalTranslation(value: number, loopWidth: number) {
  "worklet";

  if (loopWidth === 0) {
    return 0;
  }

  const halfLoopWidth = loopWidth / 2;
  return ((((value + halfLoopWidth) % loopWidth) + loopWidth) % loopWidth) - halfLoopWidth;
}

function WorldMapComponent(
  {
    selectedCode,
    statuses,
    onCountryPress,
    immersive = false,
    showResetButton = true,
  }: WorldMapProps,
  ref: React.ForwardedRef<WorldMapHandle>,
) {
  const { theme } = useThemePreference();
  const [layoutMetrics, setLayoutMetrics] = useState<LayoutMetrics>({
    viewportWidth: 0,
    viewportHeight: 0,
    worldWidth: 0,
    worldHeight: 0,
    stripWidth: 0,
    contentLeft: 0,
  });

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const savedPanX = useSharedValue(0);
  const savedPanY = useSharedValue(0);
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const worldWidth = useSharedValue(0);
  const worldHeight = useSharedValue(0);
  const baseTranslateX = useSharedValue(0);

  const normalizeHorizontalPan = (nextPanX: number, zoomScale: number) => {
    "worklet";

    if (immersive) {
      return wrapHorizontalTranslation(nextPanX, worldWidth.value * zoomScale);
    }

    return clampHorizontalTranslation(nextPanX, zoomScale, viewportWidth.value, worldWidth.value);
  };

  const resetView = () => {
    scale.value = 1;
    savedScale.value = 1;
    panX.value = 0;
    panY.value = 0;
    savedPanX.value = 0;
    savedPanY.value = 0;
  };

  const setZoom = (nextScale: number) => {
    const clampedScale = clamp(nextScale, 1, MAX_SCALE);
    scale.value = clampedScale;
    savedScale.value = clampedScale;
    panX.value = normalizeHorizontalPan(panX.value, clampedScale);
    panY.value = clampVerticalTranslation(panY.value, clampedScale, viewportHeight.value, worldHeight.value);
    savedPanX.value = panX.value;
    savedPanY.value = panY.value;
  };

  useImperativeHandle(ref, () => ({
    reset: resetView,
    zoomIn: () => setZoom(scale.value + 0.6),
    zoomOut: () => setZoom(scale.value - 0.6),
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const nextLayoutMetrics = buildLayoutMetrics(width, height, immersive);

    setLayoutMetrics(nextLayoutMetrics);
    viewportWidth.value = nextLayoutMetrics.viewportWidth;
    viewportHeight.value = nextLayoutMetrics.viewportHeight;
    worldWidth.value = nextLayoutMetrics.worldWidth;
    worldHeight.value = nextLayoutMetrics.worldHeight;
    baseTranslateX.value = immersive
      ? (nextLayoutMetrics.viewportWidth - nextLayoutMetrics.worldWidth) / 2
      : 0;

    panX.value = normalizeHorizontalPan(panX.value, scale.value);
    panY.value = clampVerticalTranslation(
      panY.value,
      scale.value,
      nextLayoutMetrics.viewportHeight,
      nextLayoutMetrics.worldHeight,
    );
    savedPanX.value = panX.value;
    savedPanY.value = panY.value;
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      panX.value = normalizeHorizontalPan(savedPanX.value + event.translationX, scale.value);
      panY.value = clampVerticalTranslation(
        savedPanY.value + event.translationY,
        scale.value,
        viewportHeight.value,
        worldHeight.value,
      );
    })
    .onEnd(() => {
      savedPanX.value = panX.value;
      savedPanY.value = panY.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(savedScale.value * event.scale, 1, MAX_SCALE);
      scale.value = nextScale;
      panX.value = normalizeHorizontalPan(panX.value, nextScale);
      panY.value = clampVerticalTranslation(panY.value, nextScale, viewportHeight.value, worldHeight.value);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedPanX.value = panX.value;
      savedPanY.value = panY.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: baseTranslateX.value + panX.value },
      { translateY: panY.value },
    ],
  }));

  const copyCount = immersive ? 3 : 1;
  const stripStyle = [
    styles.mapStrip,
    {
      left: layoutMetrics.contentLeft,
      width: layoutMetrics.stripWidth,
      height: layoutMetrics.worldHeight,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        immersive ? styles.immersiveContainer : styles.card,
        {
          backgroundColor: immersive ? theme.colors.mapOcean : theme.colors.card,
          borderColor: immersive ? "transparent" : theme.colors.border,
        },
      ]}
    >
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
        <View onLayout={handleLayout} style={styles.viewport}>
          {layoutMetrics.worldWidth > 0 && layoutMetrics.worldHeight > 0 ? (
            <Animated.View style={[stripStyle, animatedStyle]}>
              <Svg
                height={layoutMetrics.worldHeight}
                preserveAspectRatio="none"
                style={styles.mapCopy}
                viewBox={`0 0 ${WORLD_MAP_VIEWBOX.width * copyCount} ${WORLD_MAP_VIEWBOX.height}`}
                width={layoutMetrics.stripWidth}
              >
                {Array.from({ length: copyCount }, (_, copyIndex) => (
                  <G key={`copy-${copyIndex}`} x={copyIndex * WORLD_MAP_VIEWBOX.width}>
                    <Rect
                      fill={theme.colors.mapOcean}
                      height={WORLD_MAP_VIEWBOX.height}
                      width={WORLD_MAP_VIEWBOX.width}
                      x={0}
                      y={0}
                    />
                    {MAP_COUNTRIES.map((country) => {
                      const status = statuses[country.code] ?? "unmarked";
                      const isSelected = selectedCode === country.code;

                      return (
                        <Path
                          clipRule="evenodd"
                          d={country.path}
                          fill={getCountryStatusColor(theme, status)}
                          fillRule="evenodd"
                          key={`${copyIndex}-${country.code}`}
                          onPress={() => onCountryPress(country.code)}
                          stroke={isSelected ? theme.colors.mapSelection : theme.colors.borderStrong}
                          strokeLinejoin="round"
                          strokeWidth={isSelected ? 2.2 : 1.1}
                        />
                      );
                    })}
                  </G>
                ))}
              </Svg>
            </Animated.View>
          ) : null}
        </View>
      </GestureDetector>

      {showResetButton ? (
        <Pressable
          onPress={resetView}
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

const ForwardedWorldMap = forwardRef(WorldMapComponent);
ForwardedWorldMap.displayName = "WorldMap";

export const WorldMap = memo(ForwardedWorldMap);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
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
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  mapStrip: {
    position: "absolute",
    top: 0,
  },
  mapCopy: {
    left: 0,
    position: "absolute",
    top: 0,
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
