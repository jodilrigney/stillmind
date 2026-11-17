import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { stopBed } from "../src/audio";
import { useSessionAwake } from "../src/keepAwake";
import { useLandscapeOnFocus } from "../src/landscape";
import { colors, fonts } from "../src/theme";

const PAD = 56;

export default function SimpleEmdr() {
  useSessionAwake();
  useLandscapeOnFocus();
  const [speed, setSpeed] = useState(0.32);
  const [paused, setPaused] = useState(false);
  const left = useRef(new Animated.Value(PAD)).current;
  const tNow = useRef(0);
  const dir = useRef<1 | -1>(1);
  const raf = useRef<number | null>(null);
  const running = useRef(true);
  const boxW = useRef(844);
  const durationRef = useRef(Math.round(9200 / (0.22 + speed)));
  durationRef.current = Math.round(9200 / (0.22 + speed));
  running.current = !paused;

  const applyX = useCallback(() => {
    const maxX = Math.max(PAD + 40, boxW.current - PAD);
    left.setValue(PAD + tNow.current * (maxX - PAD));
  }, [left]);

  useFocusEffect(
    useCallback(() => {
      stopBed();
      let last = Date.now();
      const tick = () => {
        if (running.current) {
          const now = Date.now();
          const dt = Math.min(48, now - last);
          last = now;
          tNow.current += (dt / durationRef.current) * dir.current;
          if (tNow.current >= 1) {
            tNow.current = 1;
            dir.current = -1;
          } else if (tNow.current <= 0) {
            tNow.current = 0;
            dir.current = 1;
          }
          applyX();
        } else {
          last = Date.now();
        }
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => {
        if (raf.current != null) cancelAnimationFrame(raf.current);
        stopBed();
      };
    }, [applyX])
  );

  useEffect(() => {
    applyX();
  }, [applyX, paused]);

  return (
    <View
      style={styles.screen}
      onLayout={(e) => {
        boxW.current = e.nativeEvent.layout.width;
        applyX();
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? "Resume the light" : "Pause the light"}
        onPress={() => setPaused((v) => !v)}
        style={styles.stage}
      >
        <Animated.View style={[styles.orb, { left }]}>
          <View style={styles.glow} />
          <View style={styles.core} />
        </Animated.View>
      </Pressable>
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.linen} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Simple EMDR</Text>
          <Text style={styles.sub}>Helps a busy mind with a simple side-to-side eye task. Keep your head still and follow the light.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Slower" onPress={() => setSpeed((v) => Math.max(0.15, +(v - 0.1).toFixed(1)))} style={styles.nudge}>
          <Text style={styles.nudgeText}>-</Text>
        </Pressable>
        <Text style={styles.speed}>{speed < 0.35 ? "Slow" : speed > 0.7 ? "Fast" : "Gentle"}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Faster" onPress={() => setSpeed((v) => Math.min(1, +(v + 0.1).toFixed(1)))} style={styles.nudge}>
          <Text style={styles.nudgeText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>{paused ? "Tap the screen to continue." : "Tap the screen to pause. Stop if your eyes or head feel strained."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101614" },
  stage: { flex: 1 },
  orb: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(244,228,150,0.28)",
  },
  core: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFF6C8",
  },
  bar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251,249,245,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: { fontFamily: fonts.titleBold, color: colors.linen, fontSize: 16 },
  sub: { fontFamily: fonts.body, color: "rgba(251,249,245,0.86)", fontSize: 12, lineHeight: 16, marginTop: 1 },
  nudge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(251,249,245,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeText: { color: colors.linen, fontFamily: fonts.bodyMed },
  speed: { color: colors.linen, fontFamily: fonts.body, fontSize: 13, minWidth: 52, textAlign: "center" },
  hint: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    textAlign: "center",
    color: "rgba(251,249,245,0.72)",
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
