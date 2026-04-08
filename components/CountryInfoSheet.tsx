import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemePreference } from "../hooks/useThemePreference";
import { getCountryStatusColor, getCountryStatusLabel } from "../utils/countryHelpers";
import type { CountryRecord } from "../data/countries";
import type { CountryStatus } from "../theme/types";

interface CountryInfoSheetProps {
  country: CountryRecord | null;
  status: CountryStatus;
  onClose: () => void;
  onSelectStatus: (status: CountryStatus) => void;
}

const actionOptions: { label: string; value: CountryStatus }[] = [
  { label: "Mark as visited", value: "visited" },
  { label: "Add to wishlist", value: "wishlisted" },
  { label: "Clear status", value: "unmarked" },
];

export function CountryInfoSheet({
  country,
  status,
  onClose,
  onSelectStatus,
}: CountryInfoSheetProps) {
  const { theme } = useThemePreference();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={Boolean(country)}
    >
      <View style={styles.modalRoot}>
        <Pressable
          onPress={onClose}
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
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: getCountryStatusColor(theme, status),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: status === "unmarked" ? theme.colors.text : "#FFFFFF" },
                    ]}
                  >
                    {getCountryStatusLabel(status)}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                {actionOptions.map((option) => {
                  const selected = option.value === status;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onSelectStatus(option.value);
                        onClose();
                      }}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.cardAlt,
                          borderColor: selected ? theme.colors.primary : theme.colors.border,
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
