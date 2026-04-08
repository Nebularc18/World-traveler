import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemePreviewCard } from "../../components/ThemePreviewCard";
import { useThemePreference } from "../../hooks/useThemePreference";
import type { ThemePreference } from "../../theme/types";

const themeOptions: { title: string; description: string; value: ThemePreference }[] = [
  {
    title: "Follow system",
    description: "Use the device appearance setting and switch the app immediately when it changes.",
    value: "system",
  },
  {
    title: "Light",
    description: "Warm atlas paper tones with strong map contrast.",
    value: "light",
  },
  {
    title: "Dark",
    description: "Night-map contrast tuned for tabs, cards, and the SVG map controls.",
    value: "dark",
  },
];

export default function SettingsScreen() {
  const { preference, setPreference, theme } = useThemePreference();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Appearance</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Theme preference is stored locally now, with the storage layer isolated so sync can be
            added later without rewriting screen logic.
          </Text>
        </View>

        <View style={styles.options}>
          {themeOptions.map((option) => (
            <ThemePreviewCard
              key={option.value}
              description={option.description}
              onPress={setPreference}
              selected={preference === option.value}
              title={option.title}
              value={option.value}
            />
          ))}
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
    gap: 22,
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
  options: {
    gap: 14,
  },
});
