import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACRONYM } from "../../src/brand";
import { BrandMark, Card, PrivacyBadge, SettingsSheet } from "../../src/components/ui";
import { useApp } from "../../src/context/AppProvider";
import { AFFIRMATIONS } from "../../src/data";
import { playLibraryBed } from "../../src/audio";
import { tapLight } from "../../src/haptics";
import { imgSource, photos } from "../../src/images";
import { store } from "../../src/storage";
import { colors, fonts, shadow } from "../../src/theme";

function downloadTextFile(filename: string, text: string) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function shareTextFile(filename: string, text: string) {
  if (typeof navigator === "undefined") return false;
  const file = new File([text], filename, { type: "text/plain" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: filename });
    return true;
  }
  return false;
}

const TOOLS = [
  { href: "/reset", letter: "S", word: "Still-mind", line: "Come back to still.", color: "rgba(245,236,220,0.92)" },
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
  const today = store.today();
  const [thanks, setThanks] = useState("");
  const [thanksKept, setThanksKept] = useState<"device" | "drive" | null>(null);
  const google = session?.provider === "google-local";

  const keepThanks = async (where: "device" | "drive") => {
    const text = thanks.trim();
    if (!text) return;
    const filename = `StillMind-gratitude-${today}.txt`;
    const body = `StillMind gratitude\n${today}\n\n${text}\n`;
    if (Platform.OS === "web") {
      if (where === "drive") {
        const shared = await shareTextFile(filename, body).catch(() => false);
        if (!shared) {
          downloadTextFile(filename, body);
          Linking.openURL("https://drive.google.com/drive/my-drive").catch(() => {});
        }
      } else {
        downloadTextFile(filename, body);
      }
    } else {
      const FileSystem = await import("expo-file-system");
      const Sharing = await import("expo-sharing");
      const folder = `${FileSystem.documentDirectory}StillMind/`;
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});
      const path = `${folder}${filename}`;
      await FileSystem.writeAsStringAsync(path, body);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "text/plain",
          dialogTitle: where === "drive" ? "Save to Google Drive" : "Save in your StillMind folder",
        });
      }
    }
    setThanksKept(where);
  };

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.screen} edges={["top", "left", "right"]}>
      <View pointerEvents="none" style={styles.bgLayer}>
        <Animated.Image
          source={imgSource(photos.stillMist)}
          resizeMode="cover"
          style={[styles.backdrop, { top: "-22%", height: "128%" }]}
        />
        <LinearGradient
          colors={["rgba(251,249,245,0.84)", "rgba(251,249,245,0.68)", "rgba(244,240,230,0.4)", "rgba(251,249,245,0.86)"]}
          locations={[0, 0.32, 0.62, 1]}
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
        <BrandMark showAcronym={false} />
        <Text style={styles.ask}>What do you need right now?</Text>
        <Text style={styles.purpose}>Choose a short practice for calm, balance, breath, focus, or grounding.</Text>
        <View style={styles.tools}>
          {TOOLS.map((t) => (
            <ToolCard key={t.word + t.href} {...t} />
          ))}
        </View>
        <View style={styles.quoteWrap}>
          <Text style={styles.here}>{AFFIRMATIONS[affirmationIndex]}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Another phrase"
            onPress={() => setAffirmationIndex((i) => (i + 1) % AFFIRMATIONS.length)}
            style={styles.anotherPhrase}
          >
            <Text style={styles.affirmLink}>Another phrase</Text>
          </Pressable>
        </View>
        <View style={styles.thanksWrap}>
          <Card color={colors.peachSoft}>
            <Text style={styles.thanksKicker}>My Daily Gratitude</Text>
            <Text style={styles.thanksSoft}>One small detail is enough.</Text>
            <TextInput
              value={thanks}
              onChangeText={(text) => {
                setThanks(text);
                setThanksKept(null);
              }}
              style={styles.thanksInput}
              multiline
              placeholder="ex. The light on the wall, a warm drink, someone who checked in"
              placeholderTextColor={colors.muted}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Save gratitude on this device" onPress={() => keepThanks("device").catch(() => {})}>
              <Text style={styles.affirmLink}>{thanksKept === "device" ? "Saved to your StillMind folder" : "Save on this device"}</Text>
            </Pressable>
            <Text style={styles.thanksSave}>
              StillMind never saves your information inside the app. Save this to your device's StillMind folder by selecting Save on this device.
              {google ? (
                <>
                  {" "}
                  You may also choose to save it to your{" "}
                  <Text style={styles.affirmLink} onPress={() => keepThanks("drive").catch(() => {})}>
                    Google Drive
                  </Text>
                  .
                </>
              ) : null}
            </Text>
          </Card>
        </View>
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
        if (href === "/reset") playLibraryBed("calming-zen", 0.32).catch(() => {});
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
    paddingTop: 4,
    paddingBottom: 12,
  },
  tools: {
    paddingHorizontal: 18,
    gap: 6,
    zIndex: 2,
  },
  top: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 22,
    alignItems: "center",
  },
  menu: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251,249,245,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  anotherPhrase: { alignSelf: "center", marginTop: 2 },
  affirmLink: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 12 },
  ask: {
    textAlign: "center",
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 22,
    marginBottom: 6,
  },
  purpose: {
    textAlign: "center",
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    paddingHorizontal: 36,
  },
  tool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(251,249,245,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: { fontFamily: fonts.titleBold, color: colors.sageDeep },
  toolTitle: { fontFamily: fonts.titleBold, letterSpacing: 0.6, color: colors.ink, fontSize: 13 },
  toolLine: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
  here: {
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    fontStyle: "italic",
    paddingHorizontal: 8,
  },
  quoteWrap: { marginHorizontal: 28, marginTop: 22, marginBottom: 4 },
  thanksWrap: { marginHorizontal: 18, marginTop: 14 },
  thanksKicker: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 15, marginBottom: 4 },
  thanksSoft: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  thanksSave: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 8 },
  thanksInput: {
    minHeight: 48,
    backgroundColor: colors.linen,
    borderRadius: 14,
    padding: 10,
    marginBottom: 6,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  thanksHistory: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sheetCopy: { fontFamily: fonts.body, color: colors.muted, marginVertical: 12, lineHeight: 20 },
  signOut: { fontFamily: fonts.bodyMed, color: colors.danger },
});
