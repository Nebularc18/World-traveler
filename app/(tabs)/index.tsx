import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CountryInfoSheet } from "../../components/CountryInfoSheet";
import { WorldMap } from "../../components/WorldMap";
import { useCountryStatuses } from "../../hooks/useCountryStatuses";
import { useThemePreference } from "../../hooks/useThemePreference";
import { getCountryByCode } from "../../utils/countryHelpers";
import type { CountryStatus } from "../../theme/types";

export default function MapScreen() {
  const { isHydrated: isThemeHydrated, theme } = useThemePreference();
  const { isHydrated: areStatusesHydrated, statuses, setCountryStatus } = useCountryStatuses();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const isHydrated = isThemeHydrated && areStatusesHydrated;

  const selectedCountry = useMemo(() => getCountryByCode(selectedCode), [selectedCode]);
  const selectedCountryStatus = selectedCode ? statuses[selectedCode] ?? "unmarked" : "unmarked";

  const handleSelectStatus = async (status: CountryStatus) => {
    if (!selectedCode) {
      return;
    }

    await setCountryStatus(selectedCode, status);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.mapOcean }]}
      edges={["left", "right"]}
    >
      <View style={styles.content}>
        {isHydrated ? (
          <WorldMap
            immersive
            onCountryPress={setSelectedCode}
            selectedCode={selectedCode}
            showResetButton={false}
            statuses={statuses}
          />
        ) : (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.text} size="small" />
          </View>
        )}
      </View>

      <CountryInfoSheet
        country={selectedCountry}
        onClose={() => setSelectedCode(null)}
        onSelectStatus={handleSelectStatus}
        status={selectedCountryStatus}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
