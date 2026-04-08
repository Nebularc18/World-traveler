import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StatCard } from "../../components/StatCard";
import { countries } from "../../data/countries";
import { useCountryStatuses } from "../../hooks/useCountryStatuses";
import { useThemePreference } from "../../hooks/useThemePreference";
import { calculateTravelStats, formatPercentage } from "../../utils/stats";

export default function StatsScreen() {
  const { theme } = useThemePreference();
  const { statuses } = useCountryStatuses();
  const stats = calculateTravelStats(countries, statuses);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Travel stats</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Coverage is calculated from the local ISO-based tracking dataset with Antarctica included.
          </Text>
        </View>

        <View style={styles.grid}>
          <StatCard
            detail={`${formatPercentage(stats.visitedPercentage)} of tracked countries`}
            label="Visited"
            value={String(stats.visitedCount)}
          />
          <StatCard
            detail={`${formatPercentage(stats.wishlistedPercentage)} of tracked countries`}
            label="Wishlist"
            value={String(stats.wishlistedCount)}
          />
          <StatCard
            detail={`${formatPercentage(stats.visitedContinentPercentage)} of continents covered`}
            label="Visited continents"
            value={`${stats.visitedContinentCount}/${stats.totalContinents}`}
          />
          <StatCard
            detail={`${formatPercentage(stats.wishlistedContinentPercentage)} of continents represented`}
            label="Wishlist continents"
            value={`${stats.wishlistedContinentCount}/${stats.totalContinents}`}
          />
        </View>

        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: theme.colors.text }]}>By continent</Text>
          <View style={styles.breakdownList}>
            {stats.breakdown.map((item) => (
              <View key={item.continent} style={styles.breakdownRow}>
                <View style={styles.breakdownLabelBlock}>
                  <Text style={[styles.breakdownLabel, { color: theme.colors.text }]}>
                    {item.continent}
                  </Text>
                  <Text style={[styles.breakdownHint, { color: theme.colors.textMuted }]}>
                    {item.totalCountries} tracked
                  </Text>
                </View>
                <View style={styles.breakdownValueBlock}>
                  <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                    {item.visitedCount} visited
                  </Text>
                  <Text style={[styles.breakdownHint, { color: theme.colors.textMuted }]}>
                    {item.wishlistedCount} wishlisted
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  breakdownCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  breakdownTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  breakdownList: {
    gap: 14,
  },
  breakdownRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownLabelBlock: {
    gap: 2,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  breakdownValueBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  breakdownHint: {
    fontSize: 13,
  },
});
