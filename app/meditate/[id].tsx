import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { playAsset, playBowlTone, playRemote, setToneVolume, stopTone } from "../../src/audio";
import { ScreenHeader } from "../../src/components/ui";
import { MEDITATIONS } from "../../src/data";
import { imgSource, images, sounds } from "../../src/images";
import { useSessionAwake } from "../../src/keepAwake";
import { colors, fonts } from "../../src/theme";

type SoundMode = "forest" | "bowl" | "off";

export default function MeditationSession() {
  useSessionAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = MEDITATIONS.find((x) => x.id === id) || MEDITATIONS[0];
  const [line, setLine] = useState(0);
  const [left, setLeft] = useState(m.minutes * 60);
  const [on, setOn] = useState(true);
  const [soundMode, setSoundMode] = useState<SoundMode>("forest");
  const [volume, setVolume] = useState(0.45);
  const [url, setUrl] = useState(m.audioUrl);
  const ken = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ken, { toValue: 1.12, duration: 18000, useNativeDriver: true }),
        Animated.timing(ken, { toValue: 1, duration: 18000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ken]);

  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setLine((l) => (l + 1) % m.lines.length), 8000);
    const c = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, [on, m.lines.length]);

  useFocusEffect(
    useCallback(() => {
      if (!on || soundMode === "off") {
        stopTone();
        return () => {
          stopTone();
        };
      }
      const start = async () => {
        try {
          if (url.trim()) await playRemote(url.trim(), volume);
          else if (soundMode === "forest") await playAsset(sounds.forest, volume);
          else await playBowlTone({ freq: m.bowlFreq, volume });
        } catch {
          if (soundMode === "forest") await playAsset(sounds.forest, volume).catch(() => {});
          else await playBowlTone({ freq: m.bowlFreq, volume }).catch(() => {});
        }
      };
      start();
      return () => {
        stopTone();
      };
    }, [on, soundMode, url, volume, m.bowlFreq])
  );

  useEffect(() => {
    setToneVolume(volume);
  }, [volume]);

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen, overflow: "hidden" }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: ken }] }]}>
        <ImageBackground source={imgSource(images[m.imageKey])} style={{ flex: 1 }} />
      </Animated.View>
      <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
        <ScreenHeader title="MEDITATE" subtitle={m.title} />
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <Text style={styles.time}>{mm}</Text>
          <Text style={styles.line}>{m.lines[line]}</Text>
        </View>
        <View style={styles.dock}>
          <View style={styles.sliderRow}>
            <Text style={styles.lab}>Volume</Text>
            <Pressable onPress={() => setVolume(Math.max(0, volume - 0.1))} style={styles.nudge}>
              <Text>-</Text>
            </Pressable>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(volume * 100)}%` }]} />
            </View>
            <Pressable onPress={() => setVolume(Math.min(1, volume + 0.1))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="Optional audio link (stream or file URL)"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={on ? "Pause" : "Play"} style={styles.chip} onPress={() => setOn((v) => !v)}>
              <Text style={styles.chipText}>{on ? "Pause" : "Play"}</Text>
            </Pressable>
            {(["forest", "bowl", "off"] as const).map((mode) => (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={mode === "forest" ? "Forest" : mode === "bowl" ? "Bowl" : "Off"}
                style={[styles.chip, soundMode === mode && styles.chipOn]}
                onPress={() => setSoundMode(mode)}
              >
                <Text style={[styles.chipText, soundMode === mode && styles.chipOnText]}>
                  {mode === "forest" ? "Forest" : mode === "bowl" ? "Bowl" : "Off"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  time: { fontFamily: fonts.titleLight, fontSize: 48, color: colors.ink, textAlign: "center" },
  line: {
    fontFamily: fonts.titleBold,
    fontSize: 24,
    color: colors.ink,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 32,
  },
  dock: {
    margin: 14,
    backgroundColor: "rgba(251,249,245,0.78)",
    borderRadius: 22,
    padding: 14,
    gap: 10,
  },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lab: { fontFamily: fonts.bodyMed, color: colors.ink, width: 64 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.creamDeep, overflow: "hidden" },
  fill: { height: 10, backgroundColor: colors.sage },
  nudge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.creamDeep, alignItems: "center", justifyContent: "center" },
  input: {
    borderRadius: 14,
    backgroundColor: colors.linen,
    padding: 10,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  chip: { flex: 1, backgroundColor: colors.sageSoft, borderRadius: 16, padding: 12, alignItems: "center" },
  chipOn: { backgroundColor: colors.sage },
  chipText: { fontFamily: fonts.bodyMed, color: colors.ink },
  chipOnText: { color: colors.linen },
});
