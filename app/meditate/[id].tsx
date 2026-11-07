import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { playFrequencyPad, setFrequencyPadVolume, stopFrequencyPad, stopTone } from "../../src/audio";
import { ScreenHeader } from "../../src/components/ui";
import { MEDITATIONS } from "../../src/data";
import { ImageKey, imgSource, images } from "../../src/images";
import { useSessionAwake } from "../../src/keepAwake";
import { setSpeakVolume, speakMeditationClip, stopSpeak } from "../../src/speak";
import { colors, fonts } from "../../src/theme";

export default function MeditationSession() {
  useSessionAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Array.isArray(id) ? id[0] : id;
  const m = MEDITATIONS.find((x) => x.id === sessionId) || MEDITATIONS[0];
  const [line, setLine] = useState(0);
  const [left, setLeft] = useState(m.minutes * 60);
  const [on, setOn] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [volume, setVolume] = useState(0.46);
  const voiceVol = Math.max(0, Math.min(1, volume * 0.72));
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
    setLine(0);
    setLeft(m.minutes * 60);
  }, [m.id, m.minutes]);

  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setLine((l) => (l + 1) % m.lines.length), m.lineSeconds * 1000);
    const c = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, [on, m.lines.length, m.lineSeconds]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopTone();
        stopFrequencyPad();
        stopSpeak();
      };
    }, [])
  );

  useEffect(() => {
    if (!on || !musicOn) {
      stopTone();
      stopFrequencyPad();
      return;
    }
    playFrequencyPad(m.musicId, volume).catch(() => {});
  }, [on, musicOn, m.musicId]);

  useEffect(() => {
    setFrequencyPadVolume(volume);
    setSpeakVolume(voiceVol);
  }, [volume, voiceVol]);

  useEffect(() => {
    if (!on || !voiceOn) {
      stopSpeak();
      return;
    }
    speakMeditationClip(`${m.id}-${line}`, voiceVol).catch(() => {});
  }, [line, on, voiceOn, m.id]);

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen, overflow: "hidden" }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: ken }] }]}>
        <ImageBackground
          source={imgSource(images[m.imageKey as ImageKey])}
          style={{ flex: 1 }}
          imageStyle={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </Animated.View>
      <LinearGradient colors={["rgba(244,240,230,0.42)", "rgba(244,240,230,0.08)", "rgba(244,240,230,0.36)"]} style={{ flex: 1 }}>
        <ScreenHeader title="MEDITATE" subtitle={m.title} />
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <View style={styles.script}>
            <Text style={styles.theme}>{m.theme}</Text>
            <Text style={styles.time}>{mm}</Text>
            <Text style={styles.line}>{m.lines[line]}</Text>
          </View>
        </View>
        <View style={styles.dock}>
          <View style={styles.toggleRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={on ? "Pause" : "Play"}
              style={[styles.play, !on && styles.playOff]}
              onPress={() => {
                if (on) {
                  setOn(false);
                  stopFrequencyPad();
                  stopSpeak();
                  return;
                }
                setOn(true);
                if (musicOn) playFrequencyPad(m.musicId, volume).catch(() => {});
                if (voiceOn) speakMeditationClip(`${m.id}-${line}`, voiceVol).catch(() => {});
              }}
            >
              <Ionicons name={on ? "pause" : "play"} size={16} color={on ? colors.linen : colors.sageDeep} />
              <Text style={[styles.playText, !on && styles.playTextOff]}>{on ? "Pause" : "Begin"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: musicOn }}
              style={[styles.toggle, musicOn && styles.toggleOn]}
              onPress={() => {
                if (musicOn) {
                  setMusicOn(false);
                  stopFrequencyPad();
                  return;
                }
                setMusicOn(true);
                if (on) playFrequencyPad(m.musicId, volume).catch(() => {});
              }}
            >
              <Ionicons name={musicOn ? "musical-notes" : "musical-notes-outline"} size={16} color={musicOn ? colors.sageDeep : colors.muted} />
              <Text style={[styles.toggleText, musicOn && styles.toggleTextOn]}>Music</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: voiceOn }}
              style={[styles.toggle, voiceOn && styles.toggleOn]}
              onPress={() => {
                if (voiceOn) {
                  setVoiceOn(false);
                  stopSpeak();
                  return;
                }
                setVoiceOn(true);
                if (on) speakMeditationClip(`${m.id}-${line}`, voiceVol).catch(() => {});
              }}
            >
              <Ionicons name={voiceOn ? "mic" : "mic-off-outline"} size={16} color={voiceOn ? colors.sageDeep : colors.muted} />
              <Text style={[styles.toggleText, voiceOn && styles.toggleTextOn]}>Voice</Text>
            </Pressable>
          </View>
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
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  script: {
    backgroundColor: "rgba(251,249,245,0.46)",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  theme: { fontFamily: fonts.bodyMed, color: colors.ink, textAlign: "center", fontSize: 14, marginBottom: 8 },
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
    backgroundColor: "rgba(251,249,245,0.42)",
    borderRadius: 22,
    padding: 14,
    gap: 12,
  },
  toggleRow: { flexDirection: "row", gap: 8 },
  play: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1.1,
    backgroundColor: colors.sage,
    borderRadius: 16,
    paddingVertical: 12,
  },
  playOff: { backgroundColor: colors.sageSoft },
  playText: { fontFamily: fonts.bodyBold, color: colors.linen },
  playTextOff: { color: colors.sageDeep },
  toggle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 16,
    paddingVertical: 9,
    backgroundColor: "rgba(237,230,216,0.72)",
  },
  toggleOn: { backgroundColor: colors.sageSoft },
  toggleText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 11 },
  toggleTextOn: { color: colors.sageDeep },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lab: { fontFamily: fonts.bodyMed, color: colors.ink, width: 64 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.creamDeep, overflow: "hidden" },
  fill: { height: 10, backgroundColor: colors.sage },
  nudge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.creamDeep, alignItems: "center", justifyContent: "center" },
});
