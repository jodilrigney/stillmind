import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  isBedPlaying,
  LibraryTrackId,
  pauseBed,
  playFrequencyPad,
  playLibraryBed,
  resumeBed,
  setBedPan,
  setBedVolume,
  setFrequencyPadVolume,
  stopBed,
  stopFrequencyPad,
} from "../src/audio";
import { EftGuide } from "../src/components/EftGuide";
import { PracticeNote, PrimaryButton, ScreenHeader } from "../src/components/ui";
import { EFT_POINTS } from "../src/data";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { GlowDot, useOscillate } from "../src/motion";
import { setSpeakVolume, speakSoothing, stopSpeak } from "../src/speak";
import { colors, fonts } from "../src/theme";

const TAP_SPEED_MIN = 0.2;
const TAP_SPEED_MAX = 1;
const TAP_VOL = 0.32;
const EFT_VOL = 0.28;

function tapMs(speed: number) {
  return Math.round(420 + (1 - speed) * 1000);
}

function tapPan(side: number) {
  return side === 0 ? -0.36 : 0.36;
}

function easeTapPan(side: number) {
  setBedPan(tapPan(side), 320);
}

function speedWord(speed: number) {
  if (speed < 0.4) return "Slow";
  if (speed > 0.75) return "Fast";
  return "Gentle";
}

const POSES: { id: "collar" | "bicep"; label: string }[] = [
  { id: "collar", label: "Collarbone" },
  { id: "bicep", label: "Outer arm" },
];

const LAKE_ASPECT = 572 / 1024;

function coverRect(bw: number, bh: number, aspect: number) {
  if (bw <= 0 || bh <= 0) return { width: "100%" as const, height: "100%" as const, left: 0, top: 0 };
  const boxAspect = bw / bh;
  if (boxAspect > aspect) {
    const height = bw / aspect;
    return { width: bw, height, left: 0, top: (bh - height) / 2 };
  }
  const width = bh * aspect;
  return { width, height: bh, left: (bw - width) / 2, top: 0 };
}

const COLLARBONES = [
  { id: "lc", label: "Left collarbone", side: "L" as const },
  { id: "rc", label: "Right collarbone", side: "R" as const },
];
const BICEPS = [
  { id: "lb", label: "Left bicep", side: "L" as const },
  { id: "rb", label: "Right bicep", side: "R" as const },
];

type Mode = "bilateral" | "eft";

const MODES: { id: Mode; label: string }[] = [
  { id: "bilateral", label: "Bilateral Haptic Tapping" },
  { id: "eft", label: "EFT Tapping Guide" },
];

function ResetChrome({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const eft = mode === "eft";
  return (
    <>
      <ScreenHeader
        title="STILL-MIND"
        subtitle={eft ? "EFT tapping" : "Left and right tapping"}
        onBack={() => router.replace("/(tabs)")}
      />
      <PracticeNote
        helps={
          eft
            ? "Helps with stress, upset, and tension that sits in the body."
            : "Helps when you feel wired, overwhelmed, or cannot slow down."
        }
        how={
          eft
            ? "Tap the glowing point. Stay with the feeling. Use Next when you are ready."
            : "Follow the glow. Tap the same spot on the left, then the right. Choose collarbone or outer arm."
        }
      />
      <View style={styles.modes}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            onPress={() => setMode(m.id)}
            style={[styles.mode, mode === m.id && styles.modeOn]}
          >
            <Text style={[styles.modeText, mode === m.id && styles.modeTextOn]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

export default function Reset() {
  useSessionAwake();
  const [mode, setMode] = useState<Mode>("bilateral");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const drift = useOscillate(18000);
  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });
  const zoom = drift.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.18] });
  const chrome = <ResetChrome mode={mode} setMode={setMode} />;

  return (
    <View
      style={styles.page}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image
        source={imgSource(photos.stillLake)}
        style={[styles.lake, coverRect(box.w, box.h, LAKE_ASPECT), Platform.OS === "web" ? styles.lakeWebBlur : null]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(251, 249, 245, 0.18)", "rgba(247, 246, 242, 0.10)", "rgba(251, 249, 245, 0.08)"]}
        locations={[0, 0.32, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {mode === "bilateral" ? (
        <Bilateral chrome={chrome} />
      ) : (
        <View style={{ flex: 1 }}>
          {chrome}
          <Eft />
        </View>
      )}
    </View>
  );
}

function MiniSlider({
  label,
  accessibilityLabel,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.08,
  trailing,
}: {
  label: string;
  accessibilityLabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  trailing?: ReactNode;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const trackW = useRef(120);
  const dragging = useRef(false);
  const span = Math.max(0.001, max - min);
  const t = (value - min) / span;

  const setFromX = (x: number) => {
    const next = min + (x / Math.max(1, trackW.current)) * span;
    onChangeRef.current(Math.max(min, Math.min(max, +next.toFixed(2))));
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
    <View style={styles.ctrlRow}>
      <Text style={styles.ctrlLab}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}, lower`}
        onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        style={styles.nudge}
      >
        <Text style={styles.nudgeText}>-</Text>
      </Pressable>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        onLayout={(e) => {
          trackW.current = e.nativeEvent.layout.width;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={fromNative}
        onResponderMove={fromNative}
        {...(webBind as object)}
        style={styles.ctrlHit}
      >
        <View style={styles.ctrlTrack}>
          <View style={[styles.fill, { width: `${Math.round(t * 100)}%` }]} />
        </View>
        <View style={[styles.ctrlThumb, { left: `${Math.round(t * 100)}%` }]} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}, higher`}
        onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        style={styles.nudge}
      >
        <Text style={styles.nudgeText}>+</Text>
      </Pressable>
      {trailing}
    </View>
  );
}

function Bilateral({ chrome }: { chrome: ReactNode }) {
  const [phase, setPhase] = useState<"collar" | "bicep">("collar");
  const [side, setSide] = useState(0);
  const [running, setRunning] = useState(true);
  const [secs, setSecs] = useState(15);
  const [speed, setSpeed] = useState(0.55);
  const [volume, setVolume] = useState(TAP_VOL);
  const [muted, setMuted] = useState(false);
  const [track] = useState<LibraryTrackId>("calming-zen");
  const volumeRef = useRef(TAP_VOL);
  const lastVolRef = useRef(TAP_VOL);
  const mutedRef = useRef(false);
  const sideRef = useRef(0);
  const points = phase === "collar" ? COLLARBONES : BICEPS;
  const point = points[side];
  const interval = tapMs(speed);
  volumeRef.current = muted ? 0 : volume;
  mutedRef.current = muted;
  sideRef.current = side;

  useEffect(() => {
    easeTapPan(side);
  }, [side]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const next = sideRef.current === 0 ? 1 : 0;
      sideRef.current = next;
      easeTapPan(next);
      setSide(next);
    }, interval);
    return () => clearInterval(t);
  }, [running, interval, phase]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecs((n) => (n > 1 ? n - 1 : 15));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const pickPose = (next: "collar" | "bicep") => {
    setPhase(next);
    setSide(0);
    setSecs(15);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!running || muted) {
        await stopBed();
        return;
      }
      await playLibraryBed(track, volumeRef.current);
      if (!alive) return;
      await resumeBed();
      easeTapPan(sideRef.current);
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [running, track, muted]);

  useEffect(() => () => stopBed(), []);

  const sideLabel = phase === "collar" ? "Collarbone Point" : "Outer arm";
  const hear = (next: number) => {
    volumeRef.current = next;
    if (!running) return;
    if (isBedPlaying()) setBedVolume(next, 40);
    else if (next > 0.01) {
      playLibraryBed(track, next)
        .then(() => easeTapPan(sideRef.current))
        .catch(() => {});
    }
  };
  const applyVolume = (next: number) => {
    if (next <= 0.01) {
      setMuted(true);
      setVolume(0);
      hear(0);
      return;
    }
    setMuted(false);
    lastVolRef.current = next;
    setVolume(next);
    hear(next);
  };
  const toggleMute = () => {
    if (mutedRef.current) {
      const v = lastVolRef.current > 0.01 ? lastVolRef.current : TAP_VOL;
      setMuted(false);
      setVolume(v);
      hear(v);
      return;
    }
    if (volume > 0.01) lastVolRef.current = volume;
    setMuted(true);
    hear(0);
  };

  return (
    <View style={styles.bilateralPage}>
      {chrome}
      <View style={styles.figureStage}>
        <View style={styles.figureBox}>
          <Image
            source={imgSource(photos.tappingCollar)}
            resizeMode="contain"
            pointerEvents="none"
            style={[styles.tappingFig, Platform.OS === "web" ? styles.tappingEdge : null, { opacity: phase === "collar" ? 1 : 0 }]}
          />
          <Image
            source={imgSource(photos.tappingArms)}
            resizeMode="contain"
            pointerEvents="none"
            style={[styles.tappingFig, Platform.OS === "web" ? styles.tappingEdge : null, { opacity: phase === "bicep" ? 1 : 0 }]}
          />
          <View style={[styles.glow, phase === "collar" ? styles.glowCollarL : styles.glowArmL]}>
            <GlowDot active={side === 0} size={side === 0 ? 16 : 9} color="rgba(232,168,112,0.95)" />
          </View>
          <View style={[styles.glow, phase === "collar" ? styles.glowCollarR : styles.glowArmR]}>
            <GlowDot active={side === 1} size={side === 1 ? 16 : 9} color="rgba(232,168,112,0.95)" />
          </View>
          <Text style={[styles.sideLab, styles.sideLabL, side === 0 && styles.sideLabOn]}>{sideLabel}</Text>
          <Text style={[styles.sideLab, styles.sideLabR, side === 1 && styles.sideLabOn]}>{sideLabel}</Text>
        </View>
      </View>
      <LinearGradient colors={["rgba(251,249,245,0)", "rgba(251,249,245,0.55)", "rgba(251,249,245,0.88)"]} style={styles.hugDock}>
        <Text style={styles.lead}>Tap along with the glow — left, then right.</Text>
        <View style={styles.poseRow}>
          {POSES.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={p.label}
              onPress={() => pickPose(p.id)}
              style={[styles.poseChip, phase === p.id && styles.poseChipOn]}
            >
              <Text style={[styles.poseText, phase === p.id && styles.poseTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.timer}>{secs}s</Text>
        <Text style={styles.quote}>“Even though I feel overwhelmed, I accept my heart.”</Text>
        <MiniSlider
          label="Speed"
          accessibilityLabel="Tapping speed"
          value={speed}
          min={TAP_SPEED_MIN}
          max={TAP_SPEED_MAX}
          step={0.1}
          onChange={setSpeed}
          trailing={<Text style={styles.ctrlWord}>{speedWord(speed)}</Text>}
        />
        <MiniSlider
          label="Music"
          accessibilityLabel="Music volume"
          value={muted ? 0 : volume}
          step={0.08}
          onChange={applyVolume}
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={muted ? "Unmute music" : "Mute music"}
              onPress={toggleMute}
              style={styles.muteBtn}
            >
              <Ionicons name={muted ? "volume-mute-outline" : "volume-low-outline"} size={16} color={colors.ink} />
            </Pressable>
          }
        />
        <PrimaryButton
          label={running ? "Tap here when done" : "Resume"}
          onPress={() => setRunning((v) => !v)}
        />
      </LinearGradient>
    </View>
  );
}

function Eft() {
  const [i, setI] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [musicVol, setMusicVol] = useState(EFT_VOL);
  const [track] = useState<LibraryTrackId>("calming-zen");
  const [voiceVol, setVoiceVol] = useState(0.78);
  const musicVolRef = useRef(EFT_VOL);
  const voiceVolRef = useRef(0.78);
  const lastMusicRef = useRef(EFT_VOL);
  const lastVoiceRef = useRef(0.78);
  const point = EFT_POINTS[i];
  const trackRef = useRef<LibraryTrackId>("soft");
  musicVolRef.current = musicOn ? musicVol : 0;
  voiceVolRef.current = voiceOn ? voiceVol : 0;
  trackRef.current = track;

  const playTrack = async (next: LibraryTrackId, vol: number) => {
    await stopBed();
    await playFrequencyPad(next, vol);
  };

  const nextPoint = () => {
    setI((p) => (p + 1) % EFT_POINTS.length);
  };
  const prevPoint = () => {
    setI((p) => (p - 1 + EFT_POINTS.length) % EFT_POINTS.length);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const vol = musicVolRef.current;
      if (vol <= 0.01) {
        await stopBed();
        await stopFrequencyPad();
        return;
      }
      await playTrack(track, vol);
      if (!alive) return;
    })().catch(() => {});
    return () => {
      alive = false;
      stopBed();
      stopFrequencyPad();
    };
  }, [musicOn, track]);

  useEffect(() => {
    if (!voiceOn || voiceVolRef.current <= 0.01) {
      stopSpeak();
      return;
    }
    speakSoothing(`${point.label}. ${point.finger}`, point.id, voiceVolRef.current);
    return () => stopSpeak();
  }, [voiceOn, point.id, point.label, point.finger]);

  const applyMusicVol = (next: number) => {
    if (next <= 0.01) {
      setMusicOn(false);
      setMusicVol(0);
      setFrequencyPadVolume(0);
      return;
    }
    setMusicOn(true);
    lastMusicRef.current = next;
    setMusicVol(next);
    if (musicOn) setFrequencyPadVolume(next);
    else playFrequencyPad(trackRef.current, next).catch(() => {});
  };

  const applyVoiceVol = (next: number) => {
    if (next <= 0.01) {
      setVoiceOn(false);
      setVoiceVol(0);
      stopSpeak();
      setSpeakVolume(0);
      return;
    }
    setVoiceOn(true);
    lastVoiceRef.current = next;
    setVoiceVol(next);
    setSpeakVolume(next);
  };

  const toggleMusic = () => {
    if (musicOn) {
      if (musicVol > 0.01) lastMusicRef.current = musicVol;
      setMusicOn(false);
      setFrequencyPadVolume(0);
      return;
    }
    const v = lastMusicRef.current > 0.01 ? lastMusicRef.current : EFT_VOL;
    setMusicOn(true);
    setMusicVol(v);
    playTrack(trackRef.current, v).catch(() => {});
  };

  const toggleVoice = () => {
    if (voiceOn) {
      if (voiceVol > 0.01) lastVoiceRef.current = voiceVol;
      setVoiceOn(false);
      stopSpeak();
      return;
    }
    const v = lastVoiceRef.current > 0.01 ? lastVoiceRef.current : 0.78;
    setVoiceOn(true);
    setVoiceVol(v);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 0 }}>
        <View style={styles.eftHead}>
          <Text style={styles.kicker}>EFT · {i + 1} of {EFT_POINTS.length}</Text>
        </View>
        <View style={styles.eftTitleRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous tapping point"
            onPress={prevPoint}
            style={styles.prevBtn}
          >
            <Ionicons name="chevron-back" size={16} color={colors.ink} />
            <Text style={styles.nextLab}>Back</Text>
          </Pressable>
          <Text style={[styles.big, { marginVertical: 4, flex: 1, textAlign: "center" }]}>{point.label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next tapping point"
            onPress={nextPoint}
            style={styles.nextBtn}
          >
            <Text style={styles.nextLab}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.dots}>
          {EFT_POINTS.map((p, idx) => (
            <View key={p.id} style={[styles.dot, idx === i && styles.dotOn]} />
          ))}
        </View>
        <View style={styles.eftVols}>
          <MiniSlider
            label="Voice"
            accessibilityLabel="Voice volume"
            value={voiceOn ? voiceVol : 0}
            step={0.06}
            onChange={applyVoiceVol}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={voiceOn ? "Turn off voice guidance" : "Hear the tapping instructions"}
                onPress={toggleVoice}
                style={styles.muteBtn}
              >
                <Ionicons name={voiceOn ? "volume-high-outline" : "volume-mute-outline"} size={16} color={colors.ink} />
              </Pressable>
            }
          />
          <MiniSlider
            label="Music"
            accessibilityLabel="Music volume"
            value={musicOn ? musicVol : 0}
            step={0.06}
            onChange={applyMusicVol}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={musicOn ? "Mute music" : "Unmute music"}
                onPress={toggleMusic}
                style={styles.muteBtn}
              >
                <Ionicons name={musicOn ? "musical-notes-outline" : "volume-mute-outline"} size={16} color={colors.ink} />
              </Pressable>
            }
          />
        </View>
      </View>
      <EftGuide activeId={point.id} hint={point.hint} finger={point.finger} onNext={nextPoint} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.linen,
  },
  lake: {
    position: "absolute",
    transform: [{ scale: 1.03 }],
  },
  lakeWebBlur: {
    // @ts-expect-error web-only gauze
    filter: "blur(2px)",
  },
  mist: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(244, 247, 246, 0.14)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: "140%",
    height: "140%",
    left: "-20%",
    top: "-28%",
  },
  bilateralPage: {
    flex: 1,
  },
  tappingFig: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  tappingEdge: {
    // @ts-expect-error web-only: soften silhouette without blurring the drawing
    filter: "drop-shadow(0 0 4px rgba(251, 249, 245, 0.55)) drop-shadow(0 0 10px rgba(247, 246, 242, 0.32))",
  },
  figureStage: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  figureBox: {
    height: "100%",
    maxWidth: "100%",
    aspectRatio: 719 / 936,
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  glowCollarL: { left: "31%", top: "39%" },
  glowCollarR: { left: "69%", top: "39%" },
  glowArmL: { left: "17%", top: "55%" },
  glowArmR: { left: "83%", top: "55%" },
  sideLab: {
    position: "absolute",
    width: 72,
    zIndex: 2,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    textAlign: "center",
    textShadowColor: "rgba(255,252,245,0.9)",
    textShadowRadius: 8,
  },
  sideLabL: { left: 0, top: "36%" },
  sideLabR: { right: 0, top: "36%" },
  sideLabOn: {
    color: colors.ink,
    fontFamily: fonts.bodyMed,
  },
  hugDock: {
    zIndex: 4,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 6,
  },
  lead: {
    textAlign: "center",
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 15,
  },
  poseRow: {
    flexDirection: "row",
    gap: 8,
  },
  poseChip: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "rgba(251,249,245,0.8)",
  },
  poseChipOn: {
    backgroundColor: colors.sageSoft,
  },
  poseText: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: colors.ink,
  },
  poseTextOn: {
    color: colors.sageDeep,
  },
  timer: {
    textAlign: "center",
    fontFamily: fonts.titleLight,
    fontSize: 36,
    color: colors.ink,
  },
  modes: { paddingHorizontal: 18, gap: 6, marginBottom: 6 },
  mode: {
    backgroundColor: "rgba(251,249,245,0.9)",
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: "center",
  },
  modeOn: { backgroundColor: colors.sageSoft },
  modeText: { fontFamily: fonts.bodyMed, fontSize: 14, color: colors.ink },
  modeTextOn: { color: colors.sageDeep },
  copy: { fontFamily: fonts.body, color: colors.muted, lineHeight: 20 },
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
  ctrlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctrlLab: {
    width: 52,
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: colors.ink,
  },
  ctrlHit: {
    flex: 1,
    height: 28,
    justifyContent: "center",
    position: "relative",
  },
  ctrlTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(251,249,245,0.72)",
    overflow: "hidden",
  },
  ctrlThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    marginLeft: -8,
    top: 6,
    borderRadius: 8,
    backgroundColor: colors.sage,
  },
  ctrlWord: {
    width: 52,
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 13,
  },
  muteBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quote: {
    textAlign: "center",
    fontFamily: fonts.body,
    fontStyle: "italic",
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  kicker: { fontFamily: fonts.titleBold, letterSpacing: 1.2, color: colors.muted, fontSize: 12 },
  eftHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eftTracks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
    marginLeft: 96,
  },
  eftTrack: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,249,245,0.8)",
  },
  eftTrackOn: { backgroundColor: colors.sageSoft },
  eftTrackText: { fontFamily: fonts.bodyMed, fontSize: 12, color: colors.ink },
  eftTrackTextOn: { color: colors.sageDeep },
  eftVols: { gap: 2, marginBottom: 4 },
  eftTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  prevBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 6, paddingRight: 8 },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 6, paddingLeft: 8 },
  nextLab: { fontFamily: fonts.bodyMed, fontSize: 14, color: colors.ink },
  big: { fontFamily: fonts.titleBold, fontSize: 24, color: colors.ink, marginVertical: 8 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.creamDeep },
  dotOn: { backgroundColor: colors.sageDeep, transform: [{ scale: 1.3 }] },
});
