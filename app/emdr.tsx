import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HelpGuide } from "../src/components/ui";
import { stopBed } from "../src/audio";
import { tapSide } from "../src/haptics";
import { useSessionAwake } from "../src/keepAwake";
import { useLandscapeOnFocus } from "../src/landscape";
import { colors, fonts } from "../src/theme";

const PAD = 52;
const ORB = 64;
const SETS = [24, 30, 40, 0] as const;
const LIGHTS = [
  { id: "amber", core: "#FFF6C8", glow: "rgba(255, 228, 140, 0.38)", rail: "rgba(255, 246, 200, 0.22)" },
  { id: "white", core: "#F4F7FF", glow: "rgba(226, 236, 255, 0.34)", rail: "rgba(255, 255, 255, 0.2)" },
  { id: "teal", core: "#C8F6EA", glow: "rgba(120, 214, 196, 0.34)", rail: "rgba(168, 230, 216, 0.22)" },
] as const;

type LightId = (typeof LIGHTS)[number]["id"];

function sweepMs(speed: number) {
  return Math.round(1620 - Math.max(0, Math.min(1, speed)) * 1360);
}

function speedWord(speed: number) {
  if (speed < 0.28) return "Slow";
  if (speed > 0.68) return "Fast";
  return "Gentle";
}

let clickCtx: AudioContext | null = null;

function playClick(side: "L" | "R") {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!clickCtx) clickCtx = new AC();
    if (clickCtx.state === "suspended") void clickCtx.resume();
    const t0 = clickCtx.currentTime;
    const osc = clickCtx.createOscillator();
    const gain = clickCtx.createGain();
    const pan = clickCtx.createStereoPanner();
    osc.type = "sine";
    osc.frequency.value = side === "L" ? 392 : 494;
    pan.pan.value = side === "L" ? -0.92 : 0.92;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.11, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(clickCtx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.09);
  } catch {
    /* web audio unavailable */
  }
}

export default function SimpleEmdr() {
  useSessionAwake();
  useLandscapeOnFocus();
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(0.42);
  const [paused, setPaused] = useState(false);
  const [guide, setGuide] = useState(false);
  const [resting, setResting] = useState(false);
  const [count, setCount] = useState(0);
  const [setSize, setSetSize] = useState<(typeof SETS)[number]>(24);
  const [lightId, setLightId] = useState<LightId>("amber");
  const [clicks, setClicks] = useState(false);
  const [haptic, setHaptic] = useState(false);
  const [hit, setHit] = useState<"L" | "R" | null>(null);
  const left = useRef(new Animated.Value(PAD)).current;
  const tNow = useRef(0);
  const dir = useRef<1 | -1>(1);
  const raf = useRef<number | null>(null);
  const running = useRef(true);
  const boxW = useRef(844);
  const durationRef = useRef(sweepMs(0.42));
  const countRef = useRef(0);
  const setSizeRef = useRef(setSize);
  const clicksRef = useRef(clicks);
  const hapticRef = useRef(haptic);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const light = LIGHTS.find((item) => item.id === lightId) ?? LIGHTS[0];

  durationRef.current = sweepMs(speed);
  setSizeRef.current = setSize;
  clicksRef.current = clicks;
  hapticRef.current = haptic;
  running.current = !paused && !guide && !resting;

  const applyX = useCallback(() => {
    const maxX = Math.max(PAD + 40, boxW.current - PAD);
    left.setValue(PAD + tNow.current * (maxX - PAD));
  }, [left]);

  const onEdge = useRef((side: "L" | "R") => {
    countRef.current += 1;
    const n = countRef.current;
    setCount(n);
    setHit(side);
    if (hitTimer.current) clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(() => setHit(null), 160);
    if (clicksRef.current) playClick(side);
    if (hapticRef.current) tapSide(side);
    const limit = setSizeRef.current;
    if (limit > 0 && n >= limit) {
      running.current = false;
      setPaused(true);
      setResting(true);
    }
  }).current;

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
            applyX();
            onEdge("R");
          } else if (tNow.current <= 0) {
            tNow.current = 0;
            dir.current = 1;
            applyX();
            onEdge("L");
          } else {
            applyX();
          }
        } else {
          last = Date.now();
        }
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => {
        if (raf.current != null) cancelAnimationFrame(raf.current);
        if (hitTimer.current) clearTimeout(hitTimer.current);
        stopBed();
      };
    }, [applyX, onEdge])
  );

  useEffect(() => {
    applyX();
  }, [applyX, paused]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      e.preventDefault();
      if (resting) return;
      setPaused((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resting]);

  const togglePause = () => {
    if (resting) return;
    setPaused((v) => !v);
  };

  const nextSet = () => {
    countRef.current = 0;
    setCount(0);
    setResting(false);
    setPaused(false);
  };

  const chooseSet = (size: (typeof SETS)[number]) => {
    setSetSize(size);
    countRef.current = 0;
    setCount(0);
    setResting(false);
  };

  return (
    <View style={styles.screen}>
      <View
        style={styles.stage}
        onLayout={(e) => {
          boxW.current = e.nativeEvent.layout.width;
          applyX();
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? "Resume the light" : "Pause the light"}
          onPress={togglePause}
          style={styles.stageHit}
        >
          <View pointerEvents="none" style={styles.railWrap}>
            <View style={[styles.rail, { backgroundColor: light.rail }]} />
            <View style={[styles.well, styles.wellL, hit === "L" && { backgroundColor: light.core, opacity: 1 }]} />
            <View style={[styles.well, styles.wellR, hit === "R" && { backgroundColor: light.core, opacity: 1 }]} />
            <Animated.View style={[styles.orb, { left, transform: [{ translateX: -ORB / 2 }] }]}>
              <View style={[styles.glow, { backgroundColor: light.glow }]} />
              <View style={[styles.core, { backgroundColor: light.core }]} />
            </Animated.View>
          </View>
        </Pressable>
        {paused && !resting ? (
          <View pointerEvents="none" style={styles.pausedPill}>
            <Text style={styles.pausedText}>Paused</Text>
          </View>
        ) : null}
      </View>

      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: Math.max(10, insets.top) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.linen} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>EMDR</Text>
          <Text style={styles.sub}>Follow the light. Head still.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How to use EMDR"
          onPress={() => setGuide(true)}
          style={styles.iconBtn}
        >
          <Ionicons name="help-outline" size={18} color={colors.linen} />
        </Pressable>
      </View>

      <View style={[styles.dock, { paddingBottom: Math.max(10, insets.bottom + 6) }]}>
        <View style={styles.dockRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? "Play" : "Pause"}
            onPress={togglePause}
            style={[styles.playBtn, paused && styles.playBtnOn]}
          >
            <Ionicons name={paused ? "play" : "pause"} size={22} color={paused ? "#1A1814" : colors.linen} />
          </Pressable>
          <Text style={styles.speedLab}>Speed</Text>
          <SpeedSlider value={speed} onChange={setSpeed} />
          <Text style={styles.speedWord}>{speedWord(speed)}</Text>
        </View>
        <View style={styles.dockRow}>
          <Text style={styles.count}>
            {setSize > 0 ? `${count} / ${setSize}` : `${count}`}
          </Text>
          {SETS.map((size) => (
            <Pressable
              key={size}
              accessibilityRole="button"
              accessibilityLabel={size === 0 ? "Free set, no auto pause" : `Set of ${size}`}
              onPress={() => chooseSet(size)}
              style={[styles.setChip, setSize === size && styles.setChipOn]}
            >
              <Text style={[styles.setChipText, setSize === size && styles.setChipTextOn]}>{size === 0 ? "Free" : size}</Text>
            </Pressable>
          ))}
          <View style={styles.spacer} />
          {LIGHTS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.id} light`}
              onPress={() => setLightId(item.id)}
              style={[styles.swatch, { backgroundColor: item.core }, lightId === item.id && styles.swatchOn]}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={clicks ? "Turn clicks off" : "Turn clicks on"}
            onPress={() => setClicks((v) => !v)}
            style={[styles.tinyBtn, clicks && styles.tinyBtnOn]}
          >
            <Ionicons name={clicks ? "volume-medium" : "volume-mute-outline"} size={15} color={clicks ? "#1A1814" : colors.linen} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={haptic ? "Turn haptic pulses off" : "Turn haptic pulses on"}
            onPress={() => setHaptic((v) => !v)}
            style={[styles.tinyBtn, haptic && styles.tinyBtnOn]}
          >
            <Ionicons name="pulse-outline" size={15} color={haptic ? "#1A1814" : colors.linen} />
          </Pressable>
        </View>
      </View>

      {resting ? (
        <View style={styles.rest}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>Set complete</Text>
            <Text style={styles.restBody}>
              Notice what is here — a thought, a feeling, or a body sensation. Nothing to fix. Stay with it for a breath or two.
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start the next set" onPress={nextSet} style={styles.restBtn}>
              <Text style={styles.restBtnText}>Next set</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <HelpGuide
        open={guide}
        title="How to use this EMDR tool"
        lines={[
          "This is a bilateral eye-movement helper. It is not a substitute for EMDR therapy with a clinician.",
          "Sit comfortably. Keep your head facing forward and still. Follow the light with your eyes only.",
          "Use the speed slider until the motion feels smooth, not strained. Pause anytime, or tap the screen, or press space.",
          "A set is a round of left-right movements. 24 is a common starting length. After a set, rest and notice what comes up, then continue.",
          "Optional clicks mark each side. Stop if you feel dizzy, nauseous, or overwhelmed.",
        ]}
        onClose={() => setGuide(false)}
      />
    </View>
  );
}

function SpeedSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const trackW = useRef(180);
  const dragging = useRef(false);

  const setFromX = (x: number) => {
    onChangeRef.current(Math.max(0, Math.min(1, x / Math.max(1, trackW.current))));
  };

  const fromNative = (e: { nativeEvent: { locationX: number } }) => {
    setFromX(e.nativeEvent.locationX);
  };

  const webBind =
    Platform.OS === "web"
      ? {
          onPointerDown: (e: {
            stopPropagation: () => void;
            currentTarget: { setPointerCapture?: (id: number) => void };
            nativeEvent: { pointerId: number; offsetX: number };
          }) => {
            e.stopPropagation();
            dragging.current = true;
            e.currentTarget.setPointerCapture?.(e.nativeEvent.pointerId);
            setFromX(e.nativeEvent.offsetX);
          },
          onPointerMove: (e: { buttons?: number; nativeEvent: { offsetX: number } }) => {
            if (!dragging.current && e.buttons !== 1) return;
            setFromX(e.nativeEvent.offsetX);
          },
          onPointerUp: () => {
            dragging.current = false;
          },
        }
      : {};

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Speed"
      accessibilityValue={{ now: Math.round(value * 100) }}
      onLayout={(e) => {
        trackW.current = e.nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={fromNative}
      onResponderMove={fromNative}
      {...(webBind as object)}
      style={styles.sliderHit}
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${Math.round(value * 100)}%` }]} />
      </View>
      <View style={[styles.sliderThumb, { left: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#070B0A" },
  stage: { flex: 1 },
  stageHit: { flex: 1 },
  railWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  rail: {
    height: 2,
    marginHorizontal: PAD,
    borderRadius: 2,
    opacity: 0.9,
  },
  well: {
    position: "absolute",
    top: "50%",
    width: 10,
    height: 10,
    marginTop: -5,
    borderRadius: 5,
    backgroundColor: "rgba(251,249,245,0.28)",
    opacity: 0.7,
  },
  wellL: { left: PAD - 5 },
  wellR: { right: PAD - 5 },
  orb: {
    position: "absolute",
    top: "50%",
    marginTop: -ORB / 2,
    width: ORB,
    height: ORB,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
  },
  core: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  pausedPill: {
    position: "absolute",
    alignSelf: "center",
    bottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(251,249,245,0.14)",
  },
  pausedText: {
    fontFamily: fonts.bodyMed,
    color: "rgba(251,249,245,0.82)",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251,249,245,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: { fontFamily: fonts.titleBold, color: colors.linen, fontSize: 16, letterSpacing: 1.4 },
  sub: { fontFamily: fonts.body, color: "rgba(251,249,245,0.62)", fontSize: 12, marginTop: 1 },
  dock: {
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: "rgba(8, 12, 11, 0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(251,249,245,0.08)",
    gap: 8,
  },
  dockRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(251,249,245,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnOn: { backgroundColor: "#F3E3A8" },
  speedLab: {
    fontFamily: fonts.bodyMed,
    color: "rgba(251,249,245,0.7)",
    fontSize: 12,
    minWidth: 38,
  },
  speedWord: {
    fontFamily: fonts.bodyMed,
    color: colors.linen,
    fontSize: 13,
    minWidth: 52,
    textAlign: "right",
  },
  sliderHit: {
    flex: 1,
    height: 36,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(251,249,245,0.16)",
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "rgba(243, 227, 168, 0.9)",
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: 8,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: "#FFF6C8",
    borderWidth: 2,
    borderColor: "rgba(16, 20, 18, 0.35)",
  },
  count: {
    fontFamily: fonts.bodyMed,
    color: colors.linen,
    fontSize: 13,
    minWidth: 48,
  },
  setChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(251,249,245,0.1)",
  },
  setChipOn: { backgroundColor: "rgba(243, 227, 168, 0.92)" },
  setChipText: { fontFamily: fonts.bodyMed, color: "rgba(251,249,245,0.82)", fontSize: 12 },
  setChipTextOn: { color: "#1A1814" },
  spacer: { flex: 1 },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.55,
  },
  swatchOn: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.linen,
  },
  tinyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(251,249,245,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tinyBtnOn: { backgroundColor: "#F3E3A8" },
  rest: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "rgba(7, 11, 10, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  restCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 22,
    backgroundColor: "rgba(251,249,245,0.94)",
    gap: 10,
  },
  restTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 22 },
  restBody: { fontFamily: fonts.body, color: colors.ink, fontSize: 16, lineHeight: 24 },
  restBtn: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: colors.sage,
    paddingVertical: 12,
    alignItems: "center",
  },
  restBtnText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 15 },
});
