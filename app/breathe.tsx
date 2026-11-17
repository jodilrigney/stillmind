import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  FREQUENCY_CLIPS,
  FrequencyClipId,
  playFrequencyPad,
  readFrequencyPadProgress,
  seekFrequencyPad,
  setFrequencyPadVolume,
  stopFrequencyPad,
  stopTone,
  webNestedMp3Uri,
} from "../src/audio";
import { ScreenHeader } from "../src/components/ui";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

const PATTERNS = {
  box: { label: "4-4-4-4 Box Breathing", steps: [4, 4, 4, 4], names: ["Inhale", "Hold", "Exhale", "Hold"] },
  relax: { label: "4-7-8 Relax", steps: [4, 7, 8], names: ["Inhale", "Hold", "Exhale"] },
};

const FREQ_VOL = 0.32;

export default function Breathe() {
  useSessionAwake();
  const [mode, setMode] = useState<"box" | "relax">("box");
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(PATTERNS.box.steps[0]);
  const [freqId, setFreqId] = useState<FrequencyClipId | null>("528");
  const [musicOn, setMusicOn] = useState(false);
  const [musicVol, setMusicVol] = useState(FREQ_VOL);
  const scale = useRef(new Animated.Value(0.78)).current;
  const freqScrollRef = useRef<ScrollView>(null);
  const chipX = useRef<Partial<Record<FrequencyClipId, number>>>({});
  const drift = useOscillate(18000);
  const pattern = PATTERNS[mode];
  const name = pattern.names[step % pattern.names.length];
  const breathClips = FREQUENCY_CLIPS.filter(
    (clip) => clip.id !== "calming-zen" && clip.id !== "morning" && clip.id !== "soft" && clip.id !== "396"
  );
  const activeFreq = breathClips.find((c) => c.id === freqId) ?? null;

  const inhale = name === "Inhale";
  const exhale = name === "Exhale";
  const breathCue = inhale ? "Expand" : exhale ? "Let the tide go out" : "Soft pause";

  useEffect(() => {
    const uri = webNestedMp3Uri("audio/freq/852.mp3");
    fetch(uri).catch(() => {});
  }, []);

  useEffect(() => {
    setStep(0);
    setCount(PATTERNS[mode].steps[0]);
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      stopTone();
      return () => {
        stopTone();
        stopFrequencyPad();
      };
    }, [])
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!musicOn || !activeFreq || musicVol <= 0.01) {
        await stopFrequencyPad();
        return;
      }
      await playFrequencyPad(activeFreq.id, musicVol);
      if (!alive) await stopFrequencyPad();
    })().catch(() => {});
    return () => {
      alive = false;
      stopFrequencyPad();
    };
  }, [musicOn, activeFreq]);

  useEffect(() => {
    if (!musicOn || !activeFreq) return;
    setFrequencyPadVolume(musicVol);
  }, [musicVol, musicOn, activeFreq]);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => {
        if (c > 1) return c - 1;
        setStep((s) => (s + 1) % pattern.steps.length);
        return pattern.steps[(step + 1) % pattern.steps.length];
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, step, pattern.steps]);

  useEffect(() => {
    if (name === "Hold") {
      scale.stopAnimation();
      return;
    }
    Animated.timing(scale, {
      toValue: inhale ? 1.08 : 0.72,
      duration: (pattern.steps[step] || 4) * 900,
      useNativeDriver: true,
    }).start();
  }, [step, inhale, name, pattern.steps, scale]);

  const [progress, setProgress] = useState(0);
  const dragging = useRef(false);
  const trackW = useRef(1);
  const clock = useMemo(() => `0:${String(count).padStart(2, "0")}`, [count]);
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const zoom = drift.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.2] });

  useEffect(() => {
    if (!musicOn || !activeFreq) {
      setProgress(0);
      return;
    }
    let on = true;
    const read = async () => {
      if (!on || dragging.current) return;
      const times = await readFrequencyPadProgress();
      if (!on || !times || times.duration <= 0) return;
      setProgress(times.position / times.duration);
    };
    read().catch(() => {});
    const t = setInterval(() => {
      read().catch(() => {});
    }, 400);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [musicOn, activeFreq]);

  const seekAt = (x: number) => {
    const ratio = Math.max(0, Math.min(1, x / Math.max(1, trackW.current)));
    setProgress(ratio);
    seekFrequencyPad(ratio).catch(() => {});
  };

  const scrollFreqIntoView = useCallback((id: FrequencyClipId, animated = true) => {
    const x = chipX.current[id];
    if (typeof x !== "number") return;
    freqScrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated });
  }, []);

  useEffect(() => {
    if (!freqId) return;
    const t = setTimeout(() => scrollFreqIntoView(freqId, false), 40);
    return () => clearTimeout(t);
  }, [freqId, scrollFreqIntoView]);

  const pickFreq = (id: FrequencyClipId) => {
    setFreqId(id);
    setMusicOn(true);
    scrollFreqIntoView(id);
  };

  const toggleMusic = () => {
    setMusicOn((on) => {
      const next = !on;
      if (!next) {
        setFrequencyPadVolume(0);
        stopFrequencyPad();
      }
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#E8C5A8", overflow: "hidden" }}>
      <Animated.Image
        source={imgSource(photos.breath)}
        resizeMode="cover"
        style={[styles.backdrop, { transform: [{ scale: zoom }, { translateX: shift }] }]}
      />
      <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
        <ScreenHeader title="INHALE" subtitle="Follow the word in the circle. Breathe with the count underneath." />
        <View style={styles.body}>
          <View style={styles.lift} />
          <View style={styles.center}>
            <View style={styles.stage}>
              <Animated.View style={[styles.ringOuter, { transform: [{ scale }] }]}>
                <LinearGradient
                  colors={["rgba(175,185,230,0.22)", "rgba(145,170,215,0.14)", "rgba(125,155,205,0.06)"]}
                  style={styles.ringGlow}
                />
                <LinearGradient
                  colors={["rgba(185,195,230,0.42)", "rgba(150,175,220,0.34)", "rgba(130,160,210,0.26)"]}
                  style={styles.ringMid}
                >
                  <LinearGradient
                    colors={["#D2D8EE", "#B4C4E2", "#96B0D4"]}
                    start={{ x: 0.3, y: 0.15 }}
                    end={{ x: 0.75, y: 0.9 }}
                    style={styles.ringInner}
                  />
                </LinearGradient>
              </Animated.View>
              <View pointerEvents="none" style={styles.bubbleWords}>
                <Text style={styles.bubbleName}>{name}</Text>
              </View>
            </View>
            <Text style={styles.clock}>{clock}</Text>
            <Text style={styles.hint}>{breathCue}</Text>
          </View>
          <View style={styles.midGapTop} />
          <View style={styles.patternRow}>
            <Pressable
              onPress={() => setMode("box")}
              style={[styles.chip, mode === "box" && styles.chipOnPeach]}
            >
              <Text style={styles.chipText}>4-4-4-4 Pattern</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("relax")}
              style={[styles.chip, mode === "relax" && styles.chipOnSage]}
            >
              <Text style={styles.chipText}>4-7-8 Pattern</Text>
            </Pressable>
          </View>
          <View style={styles.midGapBottom} />

          <View style={styles.bottom}>
          <View style={styles.freqHead}>
            <Text style={styles.freqTitle}>Music library</Text>
            <View style={styles.musicControls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={musicOn ? "Turn music off" : "Turn music on"}
                onPress={toggleMusic}
                style={[styles.musicBtn, musicOn && styles.musicBtnOn]}
              >
                <Ionicons
                  name={musicOn ? "musical-notes-outline" : "volume-mute-outline"}
                  size={14}
                  color={musicOn ? colors.linen : colors.sageDeep}
                />
                <Text style={[styles.musicLab, musicOn && styles.musicLabOn]}>{musicOn ? "Music on" : "Music off"}</Text>
              </Pressable>
              {musicOn ? (
                <View style={styles.volRow}>
                  <Text style={styles.volLab}>Vol</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Lower music volume"
                    onPress={() => setMusicVol((v) => Math.max(0.05, +(v - 0.05).toFixed(2)))}
                    style={styles.nudge}
                  >
                    <Text style={styles.nudgeText}>-</Text>
                  </Pressable>
                  <View style={styles.volTrack}>
                    <View style={[styles.volFill, { width: `${Math.round((musicVol / 0.7) * 100)}%` }]} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Raise music volume"
                    onPress={() => setMusicVol((v) => Math.min(0.7, +(v + 0.05).toFixed(2)))}
                    style={styles.nudge}
                  >
                    <Text style={styles.nudgeText}>+</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
          {activeFreq && musicOn ? (
            <Text style={styles.freqNow}>
              {activeFreq.title} · {activeFreq.heals}
            </Text>
          ) : musicOn ? (
            <Text style={styles.freqNow}>Choose a piece below</Text>
          ) : (
            <Text style={styles.freqNow}>Music is off</Text>
          )}
          {musicOn && activeFreq ? (
            <View
              accessibilityRole="adjustable"
              accessibilityLabel="Music position. Drag to move forward or back."
              style={styles.playLine}
              onLayout={(e) => {
                trackW.current = e.nativeEvent.layout.width;
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                dragging.current = true;
                seekAt(e.nativeEvent.locationX);
              }}
              onResponderMove={(e) => seekAt(e.nativeEvent.locationX)}
              onResponderRelease={() => {
                dragging.current = false;
              }}
            >
              <View style={[styles.playFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          ) : null}
          <ScrollView
            ref={freqScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.freqRow}
          >
            {breathClips.map((clip) => {
              const on = musicOn && freqId === clip.id;
              return (
                <Pressable
                  key={clip.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${clip.title}, ${clip.heals}`}
                  onPress={() => pickFreq(clip.id)}
                  onLayout={(e) => {
                    chipX.current[clip.id] = e.nativeEvent.layout.x;
                    if (clip.id === freqId) scrollFreqIntoView(clip.id, false);
                  }}
                  style={[styles.freqChip, on && styles.freqChipOn]}
                >
                  <Text style={[styles.freqHz, on && styles.freqHzOn]} numberOfLines={1}>
                    {clip.title}
                  </Text>
                  <Text style={[styles.freqHeal, on && styles.freqHealOn]} numberOfLines={2}>
                    {clip.heals}
                  </Text>
                  <Text style={styles.freqNote} numberOfLines={2}>
                    {clip.note}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "120%",
    left: "-10%",
    top: "-8%",
  },
  body: { flex: 1 },
  lift: { flex: 0.48, minHeight: 20 },
  midGapTop: { flex: 0.28, minHeight: 10 },
  midGapBottom: { flex: 0.72, minHeight: 12 },
  center: { alignItems: "center", paddingTop: 0, paddingBottom: 0, width: "100%" },
  stage: {
    width: 168,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleWords: {
    position: "absolute",
    width: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bubbleName: {
    fontFamily: fonts.titleBold,
    color: colors.ink,
    fontSize: 22,
    textAlign: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  ringGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 84,
  },
  ringMid: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ringInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
  },
  clock: {
    fontFamily: fonts.titleLight,
    fontSize: 34,
    color: "#2A261F",
    marginTop: 8,
    textShadowColor: "rgba(255,248,238,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  hint: {
    fontFamily: fonts.bodyBold,
    color: "#2A261F",
    textAlign: "center",
    fontSize: 15,
    marginTop: 4,
    paddingHorizontal: 24,
    textShadowColor: "rgba(255,248,238,0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  patternRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
  },
  bottom: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 36, gap: 6 },
  chip: {
    flex: 1,
    backgroundColor: "rgba(251,249,245,0.42)",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  chipOnPeach: { backgroundColor: "rgba(244,224,212,0.52)" },
  chipOnSage: { backgroundColor: "rgba(196,214,188,0.52)" },
  chipText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  freqHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 10,
    flexWrap: "wrap",
  },
  freqTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 13, letterSpacing: 0.4 },
  musicControls: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", flexShrink: 1 },
  musicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(196,214,188,0.48)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  musicBtnOn: { backgroundColor: "rgba(110,142,120,0.62)" },
  musicLab: { fontFamily: fonts.bodyMed, fontSize: 13, color: colors.sageDeep },
  musicLabOn: { color: colors.linen },
  volRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,249,245,0.42)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  volLab: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12 },
  volTrack: { width: 72, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  volFill: { height: 8, backgroundColor: "rgba(110,142,120,0.8)" },
  nudge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 14, lineHeight: 16 },
  freqNow: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, marginBottom: 8 },
  playLine: {
    alignSelf: "stretch",
    height: 22,
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "rgba(61,57,51,0.12)",
    borderRadius: 11,
    overflow: "hidden",
  },
  playFill: {
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.sage,
  },
  freqRow: { gap: 8, paddingVertical: 2, paddingRight: 36, paddingLeft: 2 },
  freqChip: {
    width: 136,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(251,249,245,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
  },
  freqChipOn: {
    backgroundColor: "rgba(196,214,188,0.55)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  freqHz: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 14 },
  freqHzOn: { color: colors.sageDeep },
  freqHeal: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12, marginTop: 4, lineHeight: 16 },
  freqHealOn: { color: colors.sageDeep },
  freqNote: { fontFamily: fonts.body, color: colors.ink, fontSize: 11, marginTop: 2, lineHeight: 15, opacity: 0.75 },
});
