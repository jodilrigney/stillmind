import { LinearGradient } from "expo-linear-gradient";
import { useSessionAwake } from "../src/keepAwake";
import { ReactNode, useEffect, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { EftGuide } from "../src/components/EftGuide";
import { Glass, PrimaryButton, ScreenHeader } from "../src/components/ui";
import { EFT_POINTS, MICRO_ACTIONS } from "../src/data";
import { tapHeavy, tapSide, tapSoft } from "../src/haptics";
import { imgSource, photos } from "../src/images";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

const COLLARBONES = [
  { id: "lc", label: "Left collarbone", side: "L" as const },
  { id: "rc", label: "Right collarbone", side: "R" as const },
];
const BICEPS = [
  { id: "lb", label: "Left bicep", side: "L" as const },
  { id: "rb", label: "Right bicep", side: "R" as const },
];

type Mode = "bilateral" | "eft" | "spark";

function ResetChrome({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <>
      <ScreenHeader title="STILL-MIND" subtitle="Tap and return" />
      <View style={styles.modes}>
        {(["bilateral", "eft", "spark"] as Mode[]).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityLabel={m === "spark" ? "Tiny spark" : m === "eft" ? "EFT" : "Bilateral"}
            onPress={() => setMode(m)}
            style={[styles.mode, mode === m && styles.modeOn]}
          >
            <Text style={styles.modeText}>{m === "spark" ? "Tiny spark" : m === "eft" ? "EFT" : "Bilateral"}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

export default function Reset() {
  useSessionAwake();
  const [mode, setMode] = useState<Mode>("bilateral");
  const drift = useOscillate(18000);
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });
  const zoom = drift.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.18] });
  const chrome = <ResetChrome mode={mode} setMode={setMode} />;

  if (mode === "bilateral") {
    return (
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Bilateral chrome={chrome} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#E7EFE8", overflow: "hidden" }}>
      <Animated.Image
        source={imgSource(photos.calm)}
        resizeMode="cover"
        style={[styles.backdrop, { transform: [{ scale: zoom }, { translateX: shift }] }]}
      />
      <LinearGradient colors={["rgba(255,252,245,0.42)", "rgba(244,240,230,0.5)", "rgba(251,249,245,0.88)"]} style={{ flex: 1 }}>
        {chrome}
        {mode === "eft" ? <Eft /> : <Spark />}
      </LinearGradient>
    </View>
  );
}

function Bilateral({ chrome }: { chrome: ReactNode }) {
  const [phase, setPhase] = useState<"collar" | "bicep">("collar");
  const [side, setSide] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.45);
  const [secs, setSecs] = useState(15);
  const points = phase === "collar" ? COLLARBONES : BICEPS;
  const point = points[side];
  const interval = Math.round(1300 - speed * 950);

  useEffect(() => {
    if (running) tapSide(point.side);
  }, [phase, side, running, point.side]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSide((n) => (n === 0 ? 1 : 0)), interval);
    return () => clearInterval(t);
  }, [running, interval, phase]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecs((n) => {
        if (n > 1) return n - 1;
        setPhase((p) => (p === "collar" ? "bicep" : "collar"));
        setSide(0);
        return 15;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const speedLabel = speed < 0.35 ? "Slow" : speed > 0.7 ? "Fast" : "Gentle";

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={imgSource(photos.bilateralCollar)}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { opacity: phase === "collar" ? 1 : 0 }]}
      />
      <Image
        source={imgSource(photos.bilateralArms)}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { opacity: phase === "bicep" ? 1 : 0 }]}
      />
      {chrome}
      <Text style={styles.point}>
        {point.label} · {secs}s
      </Text>
      <Text style={styles.hint}>
        {phase === "collar" ? "Soft collarbone taps, one side at a time" : "Now the outer arms, still one side at a time"}
      </Text>
      <View style={styles.hugStage} />
      <View style={styles.hugDock}>
        <View style={styles.speedRow}>
          <Text style={styles.speedLab}>Speed</Text>
          <Text style={styles.speedVal}>{speedLabel}</Text>
        </View>
        <View style={styles.sliderRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Slower"
            onPress={() => setSpeed((v) => Math.max(0.15, +(v - 0.1).toFixed(1)))}
            style={styles.nudge}
          >
            <Text style={styles.nudgeText}>−</Text>
          </Pressable>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(speed * 100)}%` }]} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Faster"
            onPress={() => setSpeed((v) => Math.min(1, +(v + 0.1).toFixed(1)))}
            style={styles.nudge}
          >
            <Text style={styles.nudgeText}>+</Text>
          </Pressable>
        </View>
        <PrimaryButton label={running ? "Pause tapping" : "Resume"} onPress={() => setRunning((v) => !v)} />
      </View>
    </View>
  );
}

function Eft() {
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(8);
  const point = EFT_POINTS[i];
  useEffect(() => {
    const t = setInterval(() => {
      setLeft((n) => {
        if (n > 1) {
          tapSoft();
          return n - 1;
        }
        tapHeavy();
        setI((p) => (p + 1) % EFT_POINTS.length);
        return 8;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={{ padding: 18 }}>
      <Glass style={{ backgroundColor: "rgba(251,249,245,0.62)" }}>
        <Text style={styles.kicker}>EFT · {i + 1} of {EFT_POINTS.length}</Text>
        <Text style={styles.big}>{point.label}</Text>
        <View style={styles.dots}>
          {EFT_POINTS.map((p, idx) => (
            <View key={p.id} style={[styles.dot, idx === i && styles.dotOn]} />
          ))}
        </View>
        <EftGuide kind={point.kind} label={point.label} hint={point.hint} finger={point.finger} />
        <Text style={styles.center}>{left}s</Text>
      </Glass>
    </View>
  );
}

function Spark() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * MICRO_ACTIONS.length));
  const [done, setDone] = useState(0);
  const action = MICRO_ACTIONS[idx];
  const next = (did: boolean) => {
    if (did) setDone((n) => n + 1);
    setIdx((i) => (i + 3) % MICRO_ACTIONS.length);
  };
  return (
    <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24 }}>
      <Glass style={styles.sparkCard}>
        <Text style={styles.sparkLead}>One tiny outdoor-sized move.{"\n"}No extra credit.</Text>
        <View>
          <Text style={styles.sparkKicker}>Just this</Text>
          <Text style={styles.sparkAction}>{action}</Text>
        </View>
        <View>
          <View style={styles.sparkBtns}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="I did it" onPress={() => next(true)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Skip" color={colors.sand} onPress={() => next(false)} />
            </View>
          </View>
          <Text style={styles.sparkFoot}>{done} tiny completions. That's plenty.</Text>
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: "140%",
    height: "140%",
    left: "-20%",
    top: "-28%",
  },
  hugStage: { flex: 1 },
  hugDock: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 2,
  },
  modes: { flexDirection: "row", gap: 8, paddingHorizontal: 18 },
  mode: {
    flex: 1,
    backgroundColor: "rgba(251,249,245,0.62)",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeOn: { backgroundColor: colors.sageSoft },
  modeText: { fontFamily: fonts.bodyMed, fontSize: 12, color: colors.ink },
  copy: { fontFamily: fonts.body, color: colors.muted, lineHeight: 20 },
  sparkCard: {
    flex: 1,
    justifyContent: "space-evenly",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "rgba(251,249,245,0.55)",
  },
  sparkLead: {
    fontFamily: fonts.body,
    color: "#2A261F",
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  sparkKicker: {
    fontFamily: fonts.titleBold,
    letterSpacing: 2.4,
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  sparkAction: {
    fontFamily: fonts.titleLight,
    fontSize: 30,
    lineHeight: 40,
    color: "#2A261F",
    textAlign: "center",
    paddingHorizontal: 8,
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  sparkBtns: {
    flexDirection: "row",
    gap: 12,
  },
  sparkFoot: {
    fontFamily: fonts.body,
    fontStyle: "italic",
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 18,
  },
  point: {
    textAlign: "center",
    fontFamily: fonts.bodyBold,
    color: "#2A261F",
    fontSize: 16,
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowRadius: 10,
  },
  hint: {
    textAlign: "center",
    fontFamily: fonts.body,
    color: "#2A261F",
    fontSize: 14,
    paddingHorizontal: 12,
    textShadowColor: "rgba(255,252,245,0.9)",
    textShadowRadius: 8,
  },
  center: {
    textAlign: "center",
    fontFamily: fonts.titleLight,
    fontSize: 28,
    color: "#2A261F",
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowRadius: 12,
  },
  speedRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  speedLab: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  speedVal: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, marginTop: 6 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(251,249,245,0.7)", overflow: "hidden" },
  fill: { height: 8, backgroundColor: colors.sage },
  nudge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(251,249,245,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 16 },
  quote: { textAlign: "center", fontFamily: fonts.body, fontStyle: "italic", color: colors.ink, marginBottom: 8 },
  kicker: { fontFamily: fonts.titleBold, letterSpacing: 1.2, color: colors.muted, fontSize: 12 },
  big: { fontFamily: fonts.titleBold, fontSize: 24, color: colors.ink, marginVertical: 8 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.creamDeep },
  dotOn: { backgroundColor: colors.sageDeep, transform: [{ scale: 1.3 }] },
});
