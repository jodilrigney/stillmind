import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { isBedPlaying, playPannedBed, setBedPan, setBedVolume, stopBed } from "../src/audio";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useLandscapeOnFocus } from "../src/landscape";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

const DOT = 26;
const WRAP = 120;
const PAD = 48;
const RIVER_ASPECT = 1600 / 1067;

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

type Mode = "run" | "feel" | "release";
type SoundMode = "stream" | "wind" | "mute";

const BED_VOL = 0.26;
const SOUND_CYCLE: SoundMode[] = ["stream", "wind", "mute"];
const SOUND_UI: Record<SoundMode, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  stream: { icon: "moon-outline", label: "Calm" },
  wind: { icon: "leaf-outline", label: "Forest Wind" },
  mute: { icon: "volume-mute-outline", label: "Mute" },
};

function panFromProgress(progress: number) {
  return progress * 2 - 1;
}

export default function Follow() {
  useSessionAwake();
  useLandscapeOnFocus();
  const [box, setBox] = useState({ w: 844, h: 390 });
  const [speed, setSpeed] = useState(0.32);
  const [seconds, setSeconds] = useState(120);
  const [soundMode, setSoundMode] = useState<SoundMode>("stream");
  const [volume, setVolume] = useState(BED_VOL);
  const [mode, setMode] = useState<Mode>("run");
  const [chromeUp, setChromeUp] = useState(true);
  const soundModeRef = useRef<SoundMode>("stream");
  const volumeRef = useRef(BED_VOL);
  soundModeRef.current = soundMode;
  volumeRef.current = volume;

  const left = useRef(new Animated.Value(PAD)).current;
  const tNow = useRef(0);
  const dir = useRef<1 | -1>(1);
  const raf = useRef<number | null>(null);
  const running = useRef(false);
  const boxW = useRef(844);
  const modeRef = useRef<Mode>("run");
  const durationRef = useRef(Math.round(9200 / (0.22 + speed)));
  const chrome = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeHide = useRef(false);

  durationRef.current = Math.round(9200 / (0.22 + speed));
  modeRef.current = mode;

  const applyX = useCallback(() => {
    const maxX = Math.max(PAD + 40, boxW.current - PAD);
    left.setValue(PAD + tNow.current * (maxX - PAD));
    setBedPan(panFromProgress(tNow.current));
  }, [left]);

  const stopSweep = useCallback(
    (after?: (v: number) => void) => {
      running.current = false;
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      applyX();
      after?.(tNow.current);
    },
    [applyX]
  );

  const startSweep = useCallback(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    running.current = true;
    let last = Date.now();
    const tick = () => {
      if (!running.current) return;
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
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [applyX]);

  const showChrome = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setChromeUp(true);
    Animated.timing(chrome, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: false, isInteraction: false }).start();
  }, [chrome]);

  const hideChrome = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setChromeUp(false);
    Animated.timing(chrome, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: false, isInteraction: false }).start();
  }, [chrome]);

  useEffect(() => {
    if (mode !== "run") {
      showChrome();
      return;
    }
    resumeHide.current = false;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hideChrome, 80);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [hideChrome, mode, showChrome]);

  useEffect(() => {
    if (mode !== "run") return;
    const c = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(c);
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      if (modeRef.current === "run") startSweep();
      const bedKind = soundModeRef.current;
      if (bedKind !== "mute") {
        playPannedBed(bedKind, volumeRef.current)
          .then(() => setBedPan(panFromProgress(tNow.current)))
          .catch(() => {});
      }
      return () => {
        stopSweep();
        stopBed();
      };
    }, [startSweep, stopSweep])
  );

  useEffect(() => {
    if (soundMode === "mute") {
      stopBed();
      return;
    }
    let alive = true;
    playPannedBed(soundMode, volumeRef.current)
      .then(() => {
        if (alive) setBedPan(panFromProgress(tNow.current));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [soundMode]);

  useEffect(() => {
    return () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const feelIt = useCallback(() => {
    if (modeRef.current !== "run") return;
    stopSweep(() => setMode("feel"));
    setBedVolume(volumeRef.current * 0.7, 300);
  }, [stopSweep]);

  const letGo = useCallback(() => {
    if (modeRef.current !== "feel") return;
    setBedVolume(volumeRef.current, 300);
    setMode("release");
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => {
      resumeHide.current = true;
      setMode("run");
      startSweep();
    }, 400);
  }, [startSweep]);

  const onScreenTap = useCallback(() => {
    const now = modeRef.current;
    if (now === "run") feelIt();
    else if (now === "feel") letGo();
    const bed = soundModeRef.current;
    if (bed !== "mute" && !isBedPlaying()) {
      playPannedBed(bed, now === "run" ? volumeRef.current * 0.7 : volumeRef.current).catch(() => {});
    }
  }, [feelIt, letGo]);

  const mm = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <View
      style={styles.screen}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        boxW.current = width;
        setBox({ w: width, h: height });
        applyX();
      }}
    >
      <View pointerEvents="none" style={styles.backdrop}>
        <Image source={imgSource(photos.stream)} style={coverRect(box.w, box.h, RIVER_ASPECT)} />
      </View>
      <View pointerEvents="none" style={styles.dim} />
      <Svg pointerEvents="none" width={box.w} height={box.h} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="50%" rx="62%" ry="70%">
            <Stop offset="0" stopColor="#000" stopOpacity="0" />
            <Stop offset="0.55" stopColor="#000" stopOpacity="0.03" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
      </Svg>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mode === "feel" ? "Tap anywhere to let it go" : "Tap anywhere to freeze"}
        onPress={onScreenTap}
        style={styles.stage}
      >
        <View pointerEvents="none" style={styles.axis}>
          <Animated.View style={[styles.dotWrap, { left }]}>
            <TrackDot frozen={mode === "feel"} releasing={mode === "release"} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View pointerEvents={chromeUp ? "box-none" : "none"} style={[styles.topBar, { opacity: chrome }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.titlePill}>
          <Text style={styles.topTitle}>Lighten</Text>
          {mode === "feel" ? (
            <Text style={styles.topHint}>Tap anywhere when you're ready to let it go.</Text>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={chromeUp ? "auto" : "none"}
        style={[styles.bottomWrap, { opacity: chrome }]}
      >
        <View style={styles.panel}>
          <Pressable onPress={mode === "feel" ? letGo : undefined} style={styles.promptHit}>
            {mode === "feel" ? (
              <>
                <Text style={styles.guide}>Keep your eyes right here.</Text>
                <Text style={styles.guideSoft}>Breathe. Just let yourself feel it.</Text>
              </>
            ) : mode === "release" ? (
              <Text style={styles.guide}>Exhale... let it go.</Text>
            ) : (
              <>
                <Text style={styles.guide}>Hold your head still.</Text>
                <Text style={styles.guideSoft}>Slowly glide your phone left to right.</Text>
                <Text style={styles.guideHint}>Let your eyes follow the light to the edges.</Text>
              </>
            )}
          </Pressable>
          <View style={styles.panelControls}>
            <View style={styles.speedRow}>
              <Text style={styles.lab}>Speed</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Slower"
                onPress={() => setSpeed(Math.max(0.15, +(speed - 0.1).toFixed(1)))}
                style={styles.nudge}
              >
                <Text>-</Text>
              </Pressable>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(speed * 100)}%` }]} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faster"
                onPress={() => setSpeed(Math.min(1, +(speed + 0.1).toFixed(1)))}
                style={styles.nudge}
              >
                <Text>+</Text>
              </Pressable>
              <Text style={styles.speedWord}>{speed < 0.35 ? "Slow" : speed > 0.7 ? "Fast" : "Gentle"}</Text>
            </View>
            <View style={styles.timerRow}>
              <Text style={styles.lab}>Timer</Text>
              <Text style={styles.val}>{mm}</Text>
            </View>
            <VolumeSlider
              value={volume}
              onChange={(next) => {
                setVolume(next);
                volumeRef.current = next;
                if (soundModeRef.current !== "mute") {
                  setBedVolume(modeRef.current === "feel" ? next * 0.7 : next, 40);
                }
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${SOUND_UI[soundMode].label}. Tap to change sound`}
              onPress={() => {
                const next = SOUND_CYCLE[(SOUND_CYCLE.indexOf(soundMode) + 1) % SOUND_CYCLE.length];
                setSoundMode(next);
              }}
              style={[styles.forestChip, soundMode !== "mute" && styles.forestChipOn]}
            >
              <Ionicons
                name={SOUND_UI[soundMode].icon}
                size={14}
                color={soundMode !== "mute" ? colors.linen : colors.sageDeep}
              />
              <Text style={[styles.forestText, soundMode !== "mute" && styles.forestTextOn]}>
                {SOUND_UI[soundMode].label}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const trackW = useRef(78);
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
    <View style={styles.volRow}>
      <Ionicons name="volume-low-outline" size={15} color={colors.ink} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quieter"
        onPress={() => onChange(Math.max(0, +(value - 0.08).toFixed(2)))}
        style={styles.nudge}
      >
        <Text>-</Text>
      </Pressable>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Volume"
        onLayout={(e) => {
          trackW.current = e.nativeEvent.layout.width;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={fromNative}
        onResponderMove={fromNative}
        {...(webBind as object)}
        style={styles.volHit}
      >
        <View style={styles.volTrack}>
          <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
        </View>
        <View style={[styles.volThumb, { left: `${Math.round(value * 100)}%` }]} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Louder"
        onPress={() => onChange(Math.min(1, +(value + 0.08).toFixed(2)))}
        style={styles.nudge}
      >
        <Text>+</Text>
      </Pressable>
    </View>
  );
}

function OrbGlow({ id }: { id: string }) {
  return (
    <Svg width={WRAP} height={WRAP}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="16%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <Stop offset="68%" stopColor="#FFFFFF" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={WRAP} height={WRAP} fill={`url(#${id})`} />
    </Svg>
  );
}

function TrackDot({ frozen, releasing }: { frozen: boolean; releasing: boolean }) {
  const pulse = useOscillate(2200);
  const burst = useRef(new Animated.Value(0)).current;
  const hold = useRef(new Animated.Value(frozen ? 1 : 0)).current;
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.14] });
  const holdScale = hold.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const bloomScale = Animated.multiply(scale, holdScale);
  const ringScale = burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] });
  const ringFade = burst.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  useEffect(() => {
    Animated.timing(hold, {
      toValue: frozen ? 1 : 0,
      duration: 280,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [frozen, hold]);

  useEffect(() => {
    if (!releasing) {
      burst.setValue(0);
      return;
    }
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [burst, releasing]);

  return (
    <View style={styles.dotInner}>
      {releasing ? (
        <Animated.View style={[styles.glowWrap, { opacity: ringFade, transform: [{ scale: ringScale }] }]}>
          <OrbGlow id="orbBurst" />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.glowWrap, { opacity: glow, transform: [{ scale: bloomScale }] }]}>
          <OrbGlow id="orbGlow" />
      </Animated.View>
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#0E1612",
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  axis: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: WRAP,
    marginTop: -WRAP / 2,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251,249,245,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  titlePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(251,249,245,0.52)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topTitle: {
    fontFamily: fonts.bodyMed,
    color: colors.ink,
    fontSize: 15,
  },
  topHint: {
    flex: 1,
    textAlign: "right",
    fontFamily: fonts.bodyMed,
    fontStyle: "italic",
    color: colors.ink,
    fontSize: 14,
  },
  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  panel: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "rgba(251,249,245,0.52)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  promptHit: { gap: 6 },
  guide: {
    textAlign: "center",
    color: "rgba(0,0,0,0.87)",
    fontFamily: fonts.bodyMed,
    fontSize: 19,
    lineHeight: 26,
  },
  guideSoft: {
    textAlign: "center",
    color: "rgba(0,0,0,0.82)",
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
  },
  guideHint: {
    textAlign: "center",
    color: "rgba(0,0,0,0.54)",
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    marginTop: 2,
  },
  panelControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  speedRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  speedWord: {
    width: 52,
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 13,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  lab: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  val: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, fontVariant: ["tabular-nums"] },
  track: { width: 78, height: 8, borderRadius: 4, backgroundColor: colors.creamDeep, overflow: "hidden" },
  fill: { height: 8, backgroundColor: colors.sage },
  nudge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.creamDeep, alignItems: "center", justifyContent: "center" },
  forestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.sageSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  forestChipOn: { backgroundColor: colors.sage },
  volRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 6,
  },
  volHit: {
    width: 78,
    height: 28,
    justifyContent: "center",
    position: "relative",
  },
  volTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.creamDeep,
    overflow: "hidden",
  },
  volThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    marginLeft: -8,
    top: 6,
    borderRadius: 8,
    backgroundColor: colors.sage,
  },
  forestText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  forestTextOn: { color: colors.linen },
  dotWrap: {
    position: "absolute",
    top: 0,
    width: WRAP,
    height: WRAP,
    marginLeft: -WRAP / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: { width: WRAP, height: WRAP, alignItems: "center", justifyContent: "center" },
  glowWrap: {
    position: "absolute",
    width: WRAP,
    height: WRAP,
  },
  core: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.95,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
});
