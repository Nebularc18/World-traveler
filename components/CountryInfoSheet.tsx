import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useThemePreference } from "../hooks/useThemePreference";
import { getCountryStatusColor, getCountryStatusLabel } from "../utils/countryHelpers";
import type { CountryRecord } from "../data/countries";
import type { CountryStatus } from "../theme/types";

interface CountryInfoSheetProps {
  country: CountryRecord | null;
  status: CountryStatus;
  onClose: () => void;
  onSelectStatus: (status: CountryStatus) => Promise<boolean>;
}

const COUNTRY_STATUS_ORDER = ["visited", "wishlisted", "unmarked"] as const;

function assertNever(value: never): never {
  throw new Error(`Unhandled country status option: ${value}`);
}

function getActionOptionLabel(status: CountryStatus): string {
  switch (status) {
    case "visited":
      return "Mark as visited";
    case "wishlisted":
      return "Add to wishlist";
    case "unmarked":
      return "Clear status";
    default:
      return assertNever(status);
  }
}

const actionOptions = COUNTRY_STATUS_ORDER.map((value) => ({
  label: getActionOptionLabel(value),
  value,
}));

function getBadgeTextColor(backgroundColor: string, defaultColor: string, inverseColor: string) {
  const normalizedColor = backgroundColor.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalizedColor)) {
    return inverseColor;
  }

  const red = Number.parseInt(normalizedColor.slice(0, 2), 16);
  const green = Number.parseInt(normalizedColor.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedColor.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.6 ? defaultColor : inverseColor;
}

export function CountryInfoSheet({
  country,
  status,
  onClose,
  onSelectStatus,
}: CountryInfoSheetProps) {
  const { theme } = useThemePreference();
  const [pendingStatus, setPendingStatus] = useState<CountryStatus | null>(null);
  const badgeBackgroundColor = getCountryStatusColor(theme, status);
  const badgeTextColor =
    status === "unmarked"
      ? theme.colors.text
      : getBadgeTextColor(badgeBackgroundColor, theme.colors.background, theme.colors.surface);
  const isWriting = pendingStatus !== null;

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        if (!isWriting) {
          onClose();
        }
      }}
      transparent
      visible={Boolean(country)}
    >
      <View style={styles.modalRoot}>
        <Pressable
          onPress={isWriting ? undefined : onClose}
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {country ? (
            <>
              <View style={styles.header}>
                <View style={styles.titleBlock}>
                  <Text style={[styles.countryName, { color: theme.colors.text }]}>{country.name}</Text>
                  <Text style={[styles.continentText, { color: theme.colors.textMuted }]}>
                    {country.continent}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: badgeBackgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: badgeTextColor },
                      ]}
                    >
                      {getCountryStatusLabel(status)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                    disabled={isWriting}
                    hitSlop={10}
                    onPress={isWriting ? undefined : onClose}
                    style={[
                      styles.closeButton,
                      {
                        backgroundColor: theme.colors.cardAlt,
                        borderColor: theme.colors.border,
                        opacity: isWriting ? 0.5 : 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons color={theme.colors.textMuted} name="close" size={18} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.actions}>
                {actionOptions.map((option) => {
                  const selected = option.value === status;
                  return (
                    <Pressable
                      disabled={isWriting || selected}
                      key={option.value}
                      onPress={async () => {
                        if (selected || isWriting) {
                          return;
                        }

                        setPendingStatus(option.value);

                        try {
                          const didUpdate = await onSelectStatus(option.value);

                          if (didUpdate) {
                            onClose();
                          }
                        } catch {
                          console.warn("Failed to update country status.");
                        } finally {
                          setPendingStatus(null);
                        }
                      }}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.cardAlt,
                          borderColor: selected ? theme.colors.primary : theme.colors.border,
                          opacity: isWriting ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.actionLabel, { color: theme.colors.text }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    gap: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  countryName: {
    fontSize: 26,
    fontWeight: "700",
  },
  continentText: {
    fontSize: 15,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
