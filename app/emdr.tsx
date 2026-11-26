import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HelpGuide } from "../src/components/ui";
import { stopBed } from "../src/audio";
import { tapSide } from "../src/haptics";
import { useSessionAwake } from "../src/keepAwake";
import { useLandscapeOnFocus } from "../src/landscape";
import { colors, fonts } from "../src/theme";

const LEDS = 21;
const SETS = [24, 30, 40, 0] as const;
const SLOW_MS = 3400;
const FAST_MS = 1200;
const END_HOLD_MS = 280;
const DEFAULT_SPEED = 0.16;
const COLORS = [
  { id: "amber", on: "#FFE27A", dim: "rgba(255, 226, 122, 0.16)" },
  { id: "white", on: "#F4F7FF", dim: "rgba(244, 247, 255, 0.14)" },
  { id: "green", on: "#8EE0B0", dim: "rgba(142, 224, 176, 0.16)" },
  { id: "blue", on: "#9BD2F2", dim: "rgba(155, 210, 242, 0.16)" },
] as const;

type ColorId = (typeof COLORS)[number]["id"];

function sweepMs(speed: number) {
  const t = Math.max(0, Math.min(1, speed));
  return Math.round(SLOW_MS - t * (SLOW_MS - FAST_MS));
}

function speedWord(speed: number) {
  if (speed < 0.3) return "Slow";
  if (speed > 0.7) return "Steady";
  return "Easy";
}

function perMin(speed: number) {
  return Math.max(1, Math.round(60000 / sweepMs(speed)));
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
    osc.frequency.value = side === "L" ? 392 : 523;
    pan.pan.value = side === "L" ? -0.95 : 0.95;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(clickCtx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.08);
  } catch {
    /* web audio unavailable */
  }
}

function toggleFullscreen() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const root = document.documentElement;
  if (!document.fullscreenElement) {
    root.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

export default function SimpleEmdr() {
  useSessionAwake();
  useLandscapeOnFocus();
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [paused, setPaused] = useState(true);
  const [guide, setGuide] = useState(false);
  const [resting, setResting] = useState(false);
  const [count, setCount] = useState(0);
  const [setSize, setSetSize] = useState<(typeof SETS)[number]>(24);
  const [colorId, setColorId] = useState<ColorId>("green");
  const [clicks, setClicks] = useState(false);
  const [haptic, setHaptic] = useState(false);
  const [led, setLed] = useState(0);
  const tNow = useRef(0);
  const dir = useRef<1 | -1>(1);
  const raf = useRef<number | null>(null);
  const running = useRef(false);
  const durationRef = useRef(sweepMs(DEFAULT_SPEED));
  const holdUntil = useRef(0);
  const countRef = useRef(0);
  const setSizeRef = useRef(setSize);
  const clicksRef = useRef(clicks);
  const hapticRef = useRef(haptic);
  const ledRef = useRef(0);
  const color = COLORS.find((item) => item.id === colorId) ?? COLORS[2];

  durationRef.current = sweepMs(speed);
  setSizeRef.current = setSize;
  clicksRef.current = clicks;
  hapticRef.current = haptic;
  running.current = !paused && !guide && !resting;

  const onEdge = useRef((side: "L" | "R") => {
    countRef.current += 1;
    const n = countRef.current;
    setCount(n);
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
          if (now >= holdUntil.current) {
            tNow.current += (dt / durationRef.current) * dir.current;
            if (tNow.current >= 1) {
              tNow.current = 1;
              dir.current = -1;
              holdUntil.current = now + END_HOLD_MS;
              onEdge("R");
            } else if (tNow.current <= 0) {
              tNow.current = 0;
              dir.current = 1;
              holdUntil.current = now + END_HOLD_MS;
              onEdge("L");
            }
            const next = tNow.current * (LEDS - 1);
            if (Math.round(next) !== Math.round(ledRef.current)) {
              ledRef.current = next;
              setLed(next);
            } else {
              ledRef.current = next;
            }
          }
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
    }, [onEdge])
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (!resting) setPaused((v) => !v);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        setSpeed((v) => Math.max(0, +(v - 0.06).toFixed(2)));
      }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        setSpeed((v) => Math.min(1, +(v + 0.06).toFixed(2)));
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resting]);

  const stopAndReset = () => {
    running.current = false;
    tNow.current = 0;
    dir.current = 1;
    ledRef.current = 0;
    countRef.current = 0;
    setLed(0);
    setCount(0);
    setPaused(true);
    setResting(false);
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

  const lit = Math.max(0, Math.min(LEDS - 1, led));

  return (
    <View style={styles.screen}>
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: Math.max(10, insets.top) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.linen} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>EMDR light bar</Text>
          <Text style={styles.sub}>Keep your head still. Follow with your eyes.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Full screen" onPress={toggleFullscreen} style={styles.iconBtn}>
          <Ionicons name="expand-outline" size={16} color={colors.linen} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="How to use the EMDR light bar" onPress={() => setGuide(true)} style={styles.iconBtn}>
          <Ionicons name="help-outline" size={18} color={colors.linen} />
        </Pressable>
      </View>

      <View style={styles.stage}>
        <View style={styles.tube}>
          {Array.from({ length: LEDS }, (_, i) => {
            const d = Math.abs(i - lit);
            const on = d < 0.55;
            const near = d < 1.2;
            return (
              <View
                key={i}
                style={[
                  styles.led,
                  {
                    backgroundColor: on ? color.on : near ? color.dim : "rgba(251,249,245,0.07)",
                    transform: [{ scale: on ? 1.55 : near ? 1.12 : 1 }],
                    opacity: on ? 1 : near ? 0.9 : 0.45,
                  },
                ]}
              />
            );
          })}
        </View>
        {paused && !resting ? (
          <Text style={styles.ready}>{count === 0 ? "Set the speed, then press Start." : "Paused"}</Text>
        ) : (
          <Text style={styles.ready}> </Text>
        )}
      </View>

      <View style={[styles.dock, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
        <View style={styles.dockRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? "Start" : "Pause"}
            onPress={() => {
              if (!resting) setPaused((v) => !v);
            }}
            style={[styles.startBtn, paused && styles.startBtnOn]}
          >
            <Ionicons name={paused ? "play" : "pause"} size={18} color={paused ? "#102018" : colors.linen} />
            <Text style={[styles.startText, paused && styles.startTextOn]}>{paused ? "Start" : "Pause"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Stop and reset" onPress={stopAndReset} style={styles.stopBtn}>
            <Text style={styles.stopText}>Stop</Text>
          </Pressable>
          <Text style={styles.speedLab}>Speed</Text>
          <SpeedSlider value={speed} onChange={setSpeed} />
          <View>
            <Text style={styles.speedWord}>{speedWord(speed)}</Text>
            <Text style={styles.speedMeta}>{perMin(speed)} / min</Text>
          </View>
        </View>
        <View style={styles.dockRow}>
          <Text style={styles.count}>{setSize > 0 ? `${count} / ${setSize}` : `${count}`}</Text>
          <Text style={styles.countLab}>sweeps</Text>
          {SETS.map((size) => (
            <Pressable
              key={size}
              accessibilityRole="button"
              accessibilityLabel={size === 0 ? "Free set" : `Set of ${size}`}
              onPress={() => chooseSet(size)}
              style={[styles.chip, setSize === size && styles.chipOn]}
            >
              <Text style={[styles.chipText, setSize === size && styles.chipTextOn]}>{size === 0 ? "Free" : size}</Text>
            </Pressable>
          ))}
          <View style={styles.spacer} />
          {COLORS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.id} light`}
              onPress={() => setColorId(item.id)}
              style={[styles.swatch, { backgroundColor: item.on }, colorId === item.id && styles.swatchOn]}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={clicks ? "Turn tones off" : "Turn tones on"}
            onPress={() => setClicks((v) => !v)}
            style={[styles.tinyBtn, clicks && styles.tinyBtnOn]}
          >
            <Ionicons name={clicks ? "volume-medium" : "volume-mute-outline"} size={15} color={clicks ? "#102018" : colors.linen} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={haptic ? "Turn vibration off" : "Turn vibration on"}
            onPress={() => setHaptic((v) => !v)}
            style={[styles.tinyBtn, haptic && styles.tinyBtnOn]}
          >
            <Ionicons name="pulse-outline" size={15} color={haptic ? "#102018" : colors.linen} />
          </Pressable>
        </View>
      </View>

      {resting ? (
        <View style={styles.rest}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>Rest</Text>
            <Text style={styles.restBody}>Take a breath. Let it go. Notice what is here — a thought, a feeling, or a body sensation.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start the next set" onPress={nextSet} style={styles.restBtn}>
              <Text style={styles.restBtnText}>Next set</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={stopAndReset}>
              <Text style={styles.restStop}>Stop</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <HelpGuide
        open={guide}
        title="How to use the light bar"
        lines={[
          "This is a bilateral eye-movement helper, like a clinic light bar. It is not EMDR therapy with a clinician.",
          "Sit comfortably. Keep your head facing forward. Follow the lit LED with your eyes only.",
          "Start is Slow on purpose — about the pace other calming tools use. Nudge the slider only if your eyes can follow easily.",
          "A set of 24 sweeps is a common starting length. After a set, rest and notice what comes up.",
          "Optional tones mark left and right. Stop if you feel dizzy, nauseous, or overwhelmed.",
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
  screen: { flex: 1, backgroundColor: "#07090A" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    zIndex: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251,249,245,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: { fontFamily: fonts.titleBold, color: colors.linen, fontSize: 16, letterSpacing: 0.6 },
  sub: { fontFamily: fonts.body, color: "rgba(251,249,245,0.55)", fontSize: 12, marginTop: 1 },
  stage: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  tube: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
    backgroundColor: "#11161A",
    borderWidth: 1,
    borderColor: "rgba(251,249,245,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "visible",
  },
  led: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  ready: {
    marginTop: 18,
    textAlign: "center",
    fontFamily: fonts.body,
    color: "rgba(251,249,245,0.55)",
    fontSize: 13,
    minHeight: 18,
  },
  dock: {
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: "#0C1012",
    borderTopWidth: 1,
    borderTopColor: "rgba(251,249,245,0.08)",
    gap: 10,
  },
  dockRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(251,249,245,0.12)",
  },
  startBtnOn: { backgroundColor: "#B7E3C0" },
  startText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 14 },
  startTextOn: { color: "#102018" },
  stopBtn: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,249,245,0.08)",
  },
  stopText: { fontFamily: fonts.bodyMed, color: "rgba(251,249,245,0.8)", fontSize: 13 },
  speedLab: { fontFamily: fonts.bodyMed, color: "rgba(251,249,245,0.62)", fontSize: 12 },
  speedWord: { fontFamily: fonts.bodyMed, color: colors.linen, fontSize: 13, textAlign: "right" },
  speedMeta: { fontFamily: fonts.body, color: "rgba(251,249,245,0.5)", fontSize: 11, textAlign: "right" },
  sliderHit: { flex: 1, minWidth: 120, height: 36, justifyContent: "center" },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(251,249,245,0.14)",
    overflow: "hidden",
  },
  sliderFill: { height: "100%", backgroundColor: "rgba(183, 227, 192, 0.9)", borderRadius: 3 },
  sliderThumb: {
    position: "absolute",
    top: 8,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: "#E8F6EC",
  },
  count: { fontFamily: fonts.bodyMed, color: colors.linen, fontSize: 14, minWidth: 48 },
  countLab: { fontFamily: fonts.body, color: "rgba(251,249,245,0.45)", fontSize: 11, marginRight: 4 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(251,249,245,0.08)",
  },
  chipOn: { backgroundColor: "#B7E3C0" },
  chipText: { fontFamily: fonts.bodyMed, color: "rgba(251,249,245,0.82)", fontSize: 12 },
  chipTextOn: { color: "#102018" },
  spacer: { flex: 1 },
  swatch: { width: 16, height: 16, borderRadius: 8, opacity: 0.55 },
  swatchOn: { opacity: 1, borderWidth: 2, borderColor: colors.linen },
  tinyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(251,249,245,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tinyBtnOn: { backgroundColor: "#B7E3C0" },
  rest: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "rgba(7, 9, 10, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  restCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 22,
    backgroundColor: "rgba(251,249,245,0.95)",
    gap: 10,
  },
  restTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 22 },
  restBody: { fontFamily: fonts.body, color: colors.ink, fontSize: 16, lineHeight: 24 },
  restBtn: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: colors.sage,
    paddingVertical: 12,
    alignItems: "center",
  },
  restBtnText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 15 },
  restStop: { fontFamily: fonts.bodyMed, color: colors.muted, textAlign: "center", paddingVertical: 6 },
});
