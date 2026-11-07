import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACRONYM } from "../../src/brand";
import { BrandMark, PrivacyBadge, SettingsSheet } from "../../src/components/ui";
import { useApp } from "../../src/context/AppProvider";
import { AFFIRMATIONS } from "../../src/data";
import { tapLight } from "../../src/haptics";
import { imgSource, photos } from "../../src/images";
import { useOscillate } from "../../src/motion";
import { colors, fonts, shadow } from "../../src/theme";

const TOOLS = [
  { href: "/reset", letter: "S", word: "Still-mind", line: "Come back to still.", color: "rgba(211,228,235,0.86)" },
  { href: "/tri-calm", letter: "T", word: "Tri-Calm", line: "Balance body, mind and senses.", color: "rgba(244,224,212,0.86)" },
  { href: "/breathe", letter: "I", word: "Inhale", line: "Slow things down with the tide.", color: "rgba(201,217,227,0.86)" },
  { href: "/follow", letter: "L", word: "Lighten", line: "Give my attention to the stream.", color: "rgba(215,226,204,0.86)" },
  { href: "/ground", letter: "L", word: "Land", line: "Come back to your body.", color: "rgba(231,215,195,0.86)" },
];

export default function CalmKit() {
  const { session, signOut } = useApp();
  const [sheet, setSheet] = useState(false);
  const [affirmationIndex, setAffirmationIndex] = useState(() => {
    const start = Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length;
    return start;
  });
  const drift = useOscillate(18000);
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });
  const zoom = drift.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1.1] });

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.screen} edges={["top", "left", "right"]}>
      <View pointerEvents="none" style={styles.bgLayer}>
        <Animated.Image
          source={imgSource(photos.water)}
          resizeMode="cover"
          style={[styles.backdrop, { transform: [{ scale: zoom }, { translateX: shift }] }]}
        />
        <LinearGradient
          colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]}
          style={styles.wash}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.top}>
          <Text style={styles.hello}>Good {greeting()}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={8}
            onPress={() => setSheet(true)}
            style={styles.menu}
          >
            <Ionicons name="menu-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <BrandMark />
        <View style={styles.affirmCard}>
          <Text style={styles.affirmKicker}>A grounded phrase for today</Text>
          <Text style={styles.affirm}>{AFFIRMATIONS[affirmationIndex]}</Text>
          <View style={styles.affirmRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAffirmationIndex((i) => (i + 1) % AFFIRMATIONS.length)}
            >
              <Text style={styles.affirmLink}>Another phrase</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/track")}>
              <Text style={styles.affirmLink}>Write gratitude</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.ask}>What do you need right now?</Text>
        <View style={styles.tools}>
          {TOOLS.map((t) => (
            <ToolCard key={t.word + t.href} {...t} />
          ))}
        </View>
        <Text style={styles.here}>You're here. StillMind is holding the rest.</Text>
      </ScrollView>
      <SettingsSheet open={sheet} onClose={() => setSheet(false)} title="StillMind">
        <PrivacyBadge />
        <Text style={styles.sheetCopy}>
          {ACRONYM.map((a) => `${a.letter} — ${a.word} (${a.maps})`).join("\n")}
        </Text>
        <Text style={styles.sheetCopy}>
          {session?.email
            ? `Signed in locally as ${session.email}.`
            : "You're using StillMind with no account."}{" "}
          Check-ins stay on this device.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out of this device"
          onPress={async () => {
            await signOut();
            setSheet(false);
            router.replace("/");
          }}
        >
          <Text style={styles.signOut}>Sign out of this device</Text>
        </Pressable>
      </SettingsSheet>
    </SafeAreaView>
  );
}





function ToolCard({
  href,
  letter,
  word,
  line,
  color,
}: {
  href: string;
  letter: string;
  word: string;
  line: string;
  color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={word}
      hitSlop={4}
      onPress={async () => {
        await tapLight();
        router.push(href as never);
      }}
      style={[styles.tool, shadow.card, { backgroundColor: color }]}
    >
      <View style={styles.letter}>
        <Text style={styles.letterText}>{letter}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toolTitle}>{word}</Text>
        <Text style={styles.toolLine}>{line}</Text>
      </View>
    </Pressable>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#E8C5A8",
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    zIndex: 0,
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scroll: {
    flex: 1,
    width: "100%",
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 28,
  },
  tools: {
    paddingHorizontal: 18,
    gap: 10,
    zIndex: 2,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    alignItems: "center",
  },
  hello: { fontFamily: fonts.body, color: colors.ink, fontSize: 15 },
  menu: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251,249,245,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  affirmCard: {
    marginHorizontal: 18,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(251,249,245,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  affirmKicker: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
  affirm: { fontFamily: fonts.title, color: colors.ink, fontSize: 18, lineHeight: 26, marginTop: 7 },
  affirmRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  affirmLink: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 12 },
  ask: {
    textAlign: "center",
    fontFamily: fonts.titleBold,
    fontSize: 20,
    color: colors.ink,
    marginVertical: 14,
  },
  tool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  letter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(251,249,245,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: { fontFamily: fonts.titleBold, color: colors.sageDeep },
  toolTitle: { fontFamily: fonts.titleBold, letterSpacing: 0.6, color: colors.ink, fontSize: 13 },
  toolLine: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
  here: {
    textAlign: "center",
    marginTop: 16,
    fontFamily: fonts.body,
    color: colors.ink,
    fontStyle: "italic",
    paddingHorizontal: 24,
  },
  sheetCopy: { fontFamily: fonts.body, color: colors.muted, marginVertical: 12, lineHeight: 20 },
  signOut: { fontFamily: fonts.bodyMed, color: colors.danger },
});
