import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  type CameraRef,
  type FilterSpecification,
  type LngLatBounds,
  type MapRef,
  type PressEventWithFeatures,
  type StyleSpecification,
} from "@maplibre/maplibre-react-native";
import type { DataDrivenPropertyValueSpecification } from "@maplibre/maplibre-gl-style-spec";
import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { type NativeSyntheticEvent, Pressable, StyleSheet, View } from "react-native";

import { WORLD_MAP_GEOJSON } from "../data/worldMap";
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

const WORLD_BOUNDS: LngLatBounds = [-180, -85, 180, 85];
const MIN_ZOOM = 0;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.75;
const SOURCE_ID = "world-countries";
const COUNTRY_FILL_LAYER_ID = "country-fills";
const COUNTRY_STROKE_LAYER_ID = "country-strokes";
const SELECTED_COUNTRY_LAYER_ID = "selected-country-stroke";

function buildBlankMapStyle(oceanColor: string): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": oceanColor,
        },
      },
    ],
  };
}

function buildStatusFillColor(statuses: CountryStatusMap, colors: {
  unmarked: string;
  visited: string;
  wishlisted: string;
}): DataDrivenPropertyValueSpecification<string> {
  const visitedCodes = Object.entries(statuses)
    .filter(([, status]) => status === "visited")
    .map(([code]) => code);
  const wishlistedCodes = Object.entries(statuses)
    .filter(([, status]) => status === "wishlisted")
    .map(([code]) => code);

  const expression: unknown[] = ["match", ["get", "code"]];

  if (visitedCodes.length > 0) {
    expression.push(visitedCodes, colors.visited);
  }

  if (wishlistedCodes.length > 0) {
    expression.push(wishlistedCodes, colors.wishlisted);
  }

  expression.push(colors.unmarked);
  return expression.length > 3
    ? (expression as DataDrivenPropertyValueSpecification<string>)
    : colors.unmarked;
}

function getPressedCountryCode(event: NativeSyntheticEvent<PressEventWithFeatures>) {
  const feature = event.nativeEvent.features.find((candidate) => {
    const code = candidate.properties?.code;
    return typeof code === "string" && code.length > 0;
  });
  const code = feature?.properties?.code;

  return typeof code === "string" ? code : null;
}

interface CountrySourceLayersProps {
  fillColor: DataDrivenPropertyValueSpecification<string>;
  isDark: boolean;
  mapStrokeColor: string;
  onPress: (event: NativeSyntheticEvent<PressEventWithFeatures>) => void;
}

const CountrySourceLayers = memo(function CountrySourceLayers({
  fillColor,
  isDark,
  mapStrokeColor,
  onPress,
}: CountrySourceLayersProps) {
  return (
    <>
      <GeoJSONSource
        data={WORLD_MAP_GEOJSON}
        hitbox={{ top: 12, right: 12, bottom: 12, left: 12 }}
        id={SOURCE_ID}
        onPress={onPress}
        tolerance={0.15}
      >
        <Layer
          id={COUNTRY_FILL_LAYER_ID}
          paint={{
            "fill-color": fillColor,
            "fill-opacity": 1,
          }}
          source={SOURCE_ID}
          type="fill"
        />
        <Layer
          id={COUNTRY_STROKE_LAYER_ID}
          paint={{
            "line-color": mapStrokeColor,
            "line-opacity": isDark ? 0.9 : 0.62,
            "line-width": isDark
              ? ["interpolate", ["linear"], ["zoom"], 0, 0.5, 3, 1, 6, 1.65]
              : ["interpolate", ["linear"], ["zoom"], 0, 0.35, 3, 0.8, 6, 1.4],
          }}
          source={SOURCE_ID}
          type="line"
        />
      </GeoJSONSource>
    </>
  );
});

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
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);

  const mapStyle = useMemo(() => buildBlankMapStyle(theme.colors.mapOcean), [theme.colors.mapOcean]);
  const fillColor = useMemo(
    () =>
      buildStatusFillColor(statuses, {
        unmarked: theme.colors.mapUnmarked,
        visited: theme.colors.mapVisited,
        wishlisted: theme.colors.mapWishlisted,
      }),
    [statuses, theme.colors.mapUnmarked, theme.colors.mapVisited, theme.colors.mapWishlisted],
  );
  const selectedFilter = useMemo<FilterSpecification | null>(
    () => (selectedCode ? ["==", ["get", "code"], selectedCode] : null),
    [selectedCode],
  );

  const resetView = useCallback(() => {
    if (!cameraRef.current) {
      return;
    }

    try {
      cameraRef.current.fitBounds(WORLD_BOUNDS, {
        duration: 300,
        padding: {
          top: 24,
          right: 16,
          bottom: 24,
          left: 16,
        },
      });
    } catch {
      // MapLibre can reject camera changes before the native map is ready.
    }
  }, []);

  const changeZoom = useCallback(async (delta: number) => {
    if (!mapRef.current || !cameraRef.current) {
      return;
    }

    try {
      const currentZoom = await mapRef.current.getZoom();
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
      cameraRef.current.zoomTo(nextZoom, { duration: 180 });
    } catch {
      // Ignore zoom requests before MapLibre has finished wiring native refs.
    }
  }, []);

  useImperativeHandle(ref, () => ({
    reset: resetView,
    zoomIn: () => {
      void changeZoom(ZOOM_STEP);
    },
    zoomOut: () => {
      void changeZoom(-ZOOM_STEP);
    },
  }), [changeZoom, resetView]);

  const handleCountryPress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const code = getPressedCountryCode(event);

      if (code) {
        onCountryPress(code);
      }
    },
    [onCountryPress],
  );

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
      <MapLibreMap
        attribution={false}
        compass={false}
        doubleTapHoldZoom={false}
        doubleTapZoom={false}
        dragPan
        logo={false}
        mapStyle={mapStyle}
        ref={mapRef}
        scaleBar={false}
        style={styles.map}
        touchPitch={false}
        touchRotate={false}
        touchZoom
      >
        <Camera
          initialViewState={{
            bounds: WORLD_BOUNDS,
            padding: {
              top: 24,
              right: 16,
              bottom: 24,
              left: 16,
            },
          }}
          maxZoom={MAX_ZOOM}
          minZoom={MIN_ZOOM}
          ref={cameraRef}
        />
        <CountrySourceLayers
          fillColor={fillColor}
          isDark={theme.isDark}
          mapStrokeColor={theme.colors.mapStroke}
          onPress={handleCountryPress}
        />
        {selectedFilter ? (
          <Layer
            filter={selectedFilter}
            id={SELECTED_COUNTRY_LAYER_ID}
            paint={{
              "line-color": theme.colors.mapSelection,
              "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 3, 2.4, 6, 4],
            }}
            source={SOURCE_ID}
            type="line"
          />
        ) : null}
      </MapLibreMap>

      {showResetButton ? (
        <Pressable
          accessibilityHint="Resets the map to its default zoom and position"
          accessibilityLabel="Reset map view"
          accessibilityRole="button"
          accessible
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
  map: {
    flex: 1,
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
