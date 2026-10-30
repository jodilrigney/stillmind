import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { HARMONY_NOTES, holdHarmony, releaseAllHarmony, releaseHarmony, stopTone } from "../src/audio";
import { tapHoldPulse, tapSide } from "../src/haptics";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useLandscapeOnFocus } from "../src/landscape";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

type Burst = { id: number; x: number; y: number };
type Thumb = { id: number; x: number; y: number };

export default function TriCalm() {
  useSessionAwake();
  useLandscapeOnFocus();
  const [on, setOn] = useState(true);
  const [hapticOn, setHapticOn] = useState(true);
  const [hapticVol, setHapticVol] = useState(0.55);
  const feel = { on: hapticOn, volume: hapticVol };

  useFocusEffect(
    useCallback(() => {
      stopTone();
      return () => {
        releaseAllHarmony();
        stopTone();
      };
    }, [])
  );

  useEffect(() => {
    if (!on) releaseAllHarmony();
  }, [on]);

  const onPressSide = useCallback(
    (side: "L" | "R") => {
      if (!on) return;
      holdHarmony(side).catch(() => {});
      tapSide(side, feel);
    },
    [on, hapticOn, hapticVol]
  );

  const onReleaseSide = useCallback(
    (side: "L" | "R") => {
      releaseHarmony(side);
    },
    []
  );

  const onReleaseAll = useCallback(() => {
    releaseAllHarmony();
  }, []);

  return (
    <View style={styles.root}>
      <Pool
        running={on}
        hapticOn={hapticOn}
        hapticVol={hapticVol}
        onPressSide={onPressSide}
        onReleaseSide={onReleaseSide}
        onReleaseAll={onReleaseAll}
      />
      <LinearGradient
        colors={["rgba(244,240,230,0.22)", "transparent", "rgba(244,240,230,0.18)"]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.titlePill}>
          <Text style={styles.topNotes}>
            {HARMONY_NOTES.L} left · {HARMONY_NOTES.R} right
          </Text>
          <Text style={styles.topTitle}>Rest both thumbs on the water</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={on ? "Pause" : "Begin"}
          onPress={() => setOn((v) => !v)}
          style={[styles.feelBtn, !on && styles.feelBtnOn]}
        >
          <Ionicons name={on ? "pause" : "play"} size={14} color={on ? colors.linen : colors.sageDeep} />
          <Text style={[styles.feelText, !on && styles.feelTextOn]}>{on ? "Pause" : "Begin"}</Text>
        </Pressable>
      </View>
      <View style={styles.bottomBar} pointerEvents="box-none">
        <View style={styles.controlRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hapticOn ? "Turn vibration off" : "Turn vibration on"}
            onPress={() => setHapticOn((v) => !v)}
            style={[styles.hapticChip, hapticOn && styles.hapticChipOn]}
          >
            <Ionicons name={hapticOn ? "pulse-outline" : "pulse"} size={14} color={hapticOn ? colors.linen : colors.sageDeep} />
            <Text style={[styles.hapticText, hapticOn && styles.hapticTextOn]}>{hapticOn ? "Haptics on" : "Haptics off"}</Text>
          </Pressable>
          {hapticOn ? (
            <View style={styles.volRow}>
              <Text style={styles.volLab}>Volume</Text>
              <Pressable onPress={() => setHapticVol((v) => Math.max(0.1, +(v - 0.1).toFixed(1)))} style={styles.nudge}>
                <Text>-</Text>
              </Pressable>
              <View style={styles.volTrack}>
                <View style={[styles.volFill, { width: `${Math.round(hapticVol * 100)}%` }]} />
              </View>
              <Pressable onPress={() => setHapticVol((v) => Math.min(1, +(v + 0.1).toFixed(1)))} style={styles.nudge}>
                <Text>+</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        <View style={styles.hintPill} pointerEvents="none">
          <Text style={styles.hint}>
            {on ? "Two bowls in a fifth. Hold, then lift to fade." : "Paused"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Pool({
  running,
  hapticOn,
  hapticVol,
  onPressSide,
  onReleaseSide,
  onReleaseAll,
}: {
  running: boolean;
  hapticOn: boolean;
  hapticVol: number;
  onPressSide: (side: "L" | "R") => void;
  onReleaseSide: (side: "L" | "R") => void;
  onReleaseAll: () => void;
}) {
  const [box, setBox] = useState({ w: 800, h: 260 });
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const thumbsRef = useRef(new Map<number, Thumb>());
  const sideCount = useRef({ L: 0, R: 0 });
  const seq = useRef(0);
  const lastSpawnAt = useRef(new Map<number, number>());
  const drift = useOscillate(42000);
  const zoom = drift.interpolate({ inputRange: [0, 1], outputRange: [1.72, 1.82] });
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
  const sideOf = (x: number): "L" | "R" => (x < box.w * 0.5 ? "L" : "R");

  const addSide = (side: "L" | "R") => {
    sideCount.current[side] += 1;
    if (sideCount.current[side] === 1) onPressSide(side);
  };

  const dropSide = (side: "L" | "R") => {
    sideCount.current[side] = Math.max(0, sideCount.current[side] - 1);
    if (sideCount.current[side] === 0) onReleaseSide(side);
  };

  const clearSides = () => {
    if (sideCount.current.L > 0 || sideCount.current.R > 0) onReleaseAll();
    sideCount.current = { L: 0, R: 0 };
  };

  const spawn = useCallback((x: number, y: number) => {
    const id = ++seq.current;
    setBursts((b) => [...b.slice(-8), { id, x, y }]);
  }, []);

  const readTouches = (e: GestureResponderEvent): Thumb[] => {
    const ne = e.nativeEvent as GestureResponderEvent["nativeEvent"] & {
      touches?: Array<{ identifier?: number; locationX: number; locationY: number }>;
    };
    const list = ne.touches && ne.touches.length ? ne.touches : [ne];
    return list
      .map((t, i) => ({
        id: typeof t.identifier === "number" ? t.identifier : i,
        x: t.locationX,
        y: t.locationY,
      }))
      .filter((t) => Number.isFinite(t.x) && Number.isFinite(t.y));
  };

  const onStart = (e: GestureResponderEvent) => {
    const next = readTouches(e);
    const prev = thumbsRef.current;
    const added = next.filter((t) => !prev.has(t.id));
    thumbsRef.current = new Map(next.map((t) => [t.id, t]));
    setThumbs(next);
    const now = Date.now();
    added.forEach((t) => {
      if (now - (lastSpawnAt.current.get(t.id) ?? 0) < 50) return;
      lastSpawnAt.current.set(t.id, now);
      spawn(t.x, t.y);
      addSide(sideOf(t.x));
    });
  };

  const onMove = (e: GestureResponderEvent) => {
    const next = readTouches(e);
    thumbsRef.current = new Map(next.map((t) => [t.id, t]));
    setThumbs(next);
  };

  const onEnd = (e: GestureResponderEvent) => {
    const ne = e.nativeEvent as GestureResponderEvent["nativeEvent"] & {
      touches?: Array<{ identifier?: number }>;
    };
    if (!ne.touches || ne.touches.length === 0) {
      thumbsRef.current = new Map();
      setThumbs([]);
      clearSides();
      return;
    }
    const next = readTouches(e);
    const removed = [...thumbsRef.current.values()].filter((t) => !next.some((n) => n.id === t.id));
    removed.forEach((t) => dropSide(sideOf(t.x)));
    thumbsRef.current = new Map(next.map((t) => [t.id, t]));
    setThumbs(next);
  };

  useEffect(() => {
    if (!thumbs.length || !running) return;
    const t = setInterval(() => {
      thumbsRef.current.forEach((p) => {
        spawn(p.x, p.y);
        tapHoldPulse(sideOf(p.x), { on: hapticOn, volume: hapticVol });
      });
    }, 820);
    return () => clearInterval(t);
  }, [thumbs.length, running, spawn, box.w, hapticOn, hapticVol]);

  useEffect(() => {
    if (!running || thumbs.length) return;
    spawn(box.w * 0.5, box.h * 0.52);
    const t = setInterval(() => spawn(box.w * 0.5, box.h * 0.52), 2200);
    return () => clearInterval(t);
  }, [running, thumbs.length, box.w, box.h, spawn]);

  const leftWell = { x: box.w * 0.28, y: box.h * 0.62 };
  const rightWell = { x: box.w * 0.72, y: box.h * 0.62 };

  return (
    <Pressable
      style={styles.pool}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onPressIn={(e) => {
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        const id = typeof e.nativeEvent.identifier === "number" ? e.nativeEvent.identifier : 0;
        const now = Date.now();
        if (now - (lastSpawnAt.current.get(id) ?? 0) < 50) return;
        lastSpawnAt.current.set(id, now);
        const thumb = { id, x, y };
        thumbsRef.current.set(id, thumb);
        setThumbs([...thumbsRef.current.values()]);
        spawn(x, y);
        addSide(sideOf(x));
      }}
      onPressOut={() => {
        thumbsRef.current = new Map();
        setThumbs([]);
        clearSides();
      }}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      <Animated.Image
        source={imgSource(photos.mistyLake)}
        resizeMode="cover"
        pointerEvents="none"
        style={[styles.water, { transform: [{ scale: zoom }, { translateX: shift }, { translateY: -18 }] }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(244,236,220,0.18)", "rgba(231,238,242,0.04)", "rgba(125,163,179,0.12)"]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.rim} />
      <ThumbWell x={leftWell.x} y={leftWell.y} label="L" active={thumbs.some((t) => t.x < box.w * 0.5)} />
      <ThumbWell x={rightWell.x} y={rightWell.y} label="R" active={thumbs.some((t) => t.x >= box.w * 0.5)} />
      {thumbs.map((t) => (
        <View key={t.id} pointerEvents="none" style={[styles.contact, { left: t.x - 18, top: t.y - 18 }]} />
      ))}
      {bursts.map((b) => (
        <RippleBurst key={b.id} x={b.x} y={b.y} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}
    </Pressable>
  );
}

function ThumbWell({ x, y, label, active }: { x: number; y: number; label: string; active: boolean }) {
  const a = useOscillate(active ? 1400 : 2800);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: active ? [0.94, 1.12] : [0.96, 1.04] });
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: active ? [0.55, 0.95] : [0.28, 0.5] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.well,
        { left: x - 34, top: y - 34, opacity, transform: [{ scale }] },
        active && styles.wellOn,
      ]}
    >
      <Text style={styles.wellText}>{label}</Text>
    </Animated.View>
  );
}

function RippleBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  return (
    <>
      <Ring x={x} y={y} delay={0} />
      <Ring x={x} y={y} delay={120} />
      <Ring x={x} y={y} delay={260} onDone={onDone} />
    </>
  );
}

function Ring({ x, y, delay, onDone }: { x: number; y: number; delay: number; onDone?: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1, duration: 1700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) onDone?.();
    });
    return () => anim.stop();
    // Mount once per ring so a new onDone identity cannot restart the ripple.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, delay]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.18, 2.8] });
  const opacity = a.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0.55, 0.4, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          left: x - 40,
          top: y - 40,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#8A9AA8", overflow: "hidden" },
  pool: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  water: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "130%",
    left: "-10%",
    top: "-12%",
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
    zIndex: 4,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251,249,245,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  titlePill: {
    flex: 1,
    backgroundColor: "rgba(251,249,245,0.82)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topNotes: {
    fontFamily: fonts.titleBold,
    color: colors.sageDeep,
    fontSize: 15,
  },
  topTitle: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 13,
  },
  feelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  feelBtnOn: { backgroundColor: colors.sageSoft },
  feelText: { fontFamily: fonts.bodyMed, color: colors.linen, fontSize: 13 },
  feelTextOn: { color: colors.sageDeep },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
    gap: 8,
    zIndex: 4,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(251,249,245,0.82)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  hapticChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.sageSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  hapticChipOn: { backgroundColor: colors.sage },
  hapticText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  hapticTextOn: { color: colors.linen },
  volRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  volLab: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  volTrack: { width: 78, height: 8, borderRadius: 4, backgroundColor: colors.creamDeep, overflow: "hidden" },
  volFill: { height: 8, backgroundColor: colors.sage },
  nudge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.creamDeep, alignItems: "center", justifyContent: "center" },
  hintPill: {
    backgroundColor: "rgba(251,249,245,0.82)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  hint: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 13,
  },
  well: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.42)",
    backgroundColor: "rgba(251,249,245,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  wellOn: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderColor: "rgba(255,255,255,0.7)",
  },
  wellText: {
    fontFamily: fonts.titleBold,
    color: "rgba(251,249,245,0.92)",
    fontSize: 16,
  },
  contact: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.28)",
    zIndex: 2,
  },
  ring: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.6,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(210,232,236,0.06)",
  },
});
