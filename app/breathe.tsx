import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { stopTone } from "../src/audio";
import { ScreenHeader } from "../src/components/ui";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

const PATTERNS = {
  box: { label: "4-4-4-4 Box Breathing", steps: [4, 4, 4, 4], names: ["Inhale", "Hold", "Exhale", "Hold"] },
  relax: { label: "4-7-8 Relax", steps: [4, 7, 8], names: ["Inhale", "Hold", "Exhale"] },
};

export default function Breathe() {
  useSessionAwake();
  const [mode, setMode] = useState<"box" | "relax">("box");
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(PATTERNS.box.steps[0]);
  const scale = useRef(new Animated.Value(0.78)).current;
  const drift = useOscillate(18000);
  const pattern = PATTERNS[mode];
  const name = pattern.names[step % pattern.names.length];

  const inhale = name === "Inhale";
  const exhale = name === "Exhale";

  useEffect(() => {
    setStep(0);
    setCount(PATTERNS[mode].steps[0]);
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      stopTone();
      return () => {
        stopTone();
      };
    }, [])
  );

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

  const clock = useMemo(() => `0:${String(count).padStart(2, "0")}`, [count]);
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const zoom = drift.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.2] });

  return (
    <View style={{ flex: 1, backgroundColor: "#E8C5A8", overflow: "hidden" }}>
      <Animated.Image
        source={imgSource(photos.breath)}
        resizeMode="cover"
        style={[styles.backdrop, { transform: [{ scale: zoom }, { translateX: shift }] }]}
      />
      <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
        <ScreenHeader title="INHALE" subtitle="Mindful Breathing" />
        <View style={styles.center}>
          <View style={styles.stage}>
            <Animated.View style={[styles.ringOuter, { transform: [{ scale }] }]}>
              <View style={styles.ringMid}>
                <View style={styles.ringInner} />
              </View>
            </Animated.View>
            <Text style={styles.phase}>{name}...</Text>
          </View>
          <Text style={styles.hint}>
            {inhale ? "Expand your chest, follow the wave" : exhale ? "Let the tide go out" : "Soft pause"}
          </Text>
          <Text style={styles.clock}>{clock}</Text>
        </View>
        <View style={{ padding: 18, paddingBottom: 28 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => setMode("box")}
              style={[styles.chip, mode === "box" && { backgroundColor: colors.peachSoft }]}
            >
              <Text style={styles.chipText}>4-4-4-4 Pattern</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("relax")}
              style={[styles.chip, mode === "relax" && { backgroundColor: colors.sageSoft }]}
            >
              <Text style={styles.chipText}>4-7-8 Pattern</Text>
            </Pressable>
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
  center: { alignItems: "center", paddingTop: 20 },
  stage: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(125,163,179,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringMid: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(125,163,179,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(125,163,179,0.58)",
  },
  phase: {
    fontFamily: fonts.titleBold,
    color: colors.paper,
    fontSize: 20,
    textShadowColor: "rgba(40,36,30,0.28)",
    textShadowRadius: 8,
  },
  hint: {
    fontFamily: fonts.bodyBold,
    color: "#2A261F",
    textAlign: "center",
    fontSize: 18,
    marginTop: 16,
    paddingHorizontal: 24,
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  clock: {
    fontFamily: fonts.titleLight,
    fontSize: 48,
    color: "#2A261F",
    marginTop: 6,
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
  },
  chipText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
});
