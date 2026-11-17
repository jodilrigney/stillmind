import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  HARMONY_NOTES,
  holdHarmony,
  openTriCalm,
  playRhythmBed,
  releaseAllHarmony,
  releaseHarmony,
  RHYTHM_BEDS,
  setHarmonyVoicing,
  setRhythmRate,
  setRhythmVolume,
  stopFrequencyPad,
  stopRhythmBed,
  stopTriCalm,
  type HarmonyVoicing,
  type RhythmBedId,
} from "../src/audio";
import { tapHoldPulse } from "../src/haptics";
import { imgSource } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useRotatableOnFocus } from "../src/landscape";
import { libraryFor, libraryPhoto } from "../src/library";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

type Burst = { id: number; x: number; y: number };
type Thumb = { id: number; x: number; y: number };

const TRI_PHOTOS = libraryFor("tri-calm");
const RHYTHM_VOL = 0.2;

function rhythmWord(rate: number) {
  if (rate < 0.97) return "Slow";
  if (rate > 1.03) return "Flowing";
  return "Gentle";
}

function blockSaveMenu(e: { preventDefault(): void; stopPropagation?: () => void }) {
  e.preventDefault();
  e.stopPropagation?.();
}

export default function TriCalm() {
  useSessionAwake();
  useRotatableOnFocus();
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "web" || typeof document === "undefined") return;
      const block = (e: Event) => e.preventDefault();
      document.addEventListener("contextmenu", block);
      document.addEventListener("dragstart", block);
      return () => {
        document.removeEventListener("contextmenu", block);
        document.removeEventListener("dragstart", block);
      };
    }, [])
  );
  const [on, setOn] = useState(true);
  const [hapticOn, setHapticOn] = useState(true);
  const [hapticVol, setHapticVol] = useState(0.55);
  const [musicOn, setMusicOn] = useState(true);
  const [musicVol, setMusicVol] = useState(RHYTHM_VOL);
  const [rhythm, setRhythm] = useState(1);
  const [bedId, setBedId] = useState<RhythmBedId>("ember");
  const [voicing, setVoicing] = useState<HarmonyVoicing>("dyad");
  const [photoId, setPhotoId] = useState(TRI_PHOTOS[0]?.id ?? "dock-mist");
  const [screenOn, setScreenOn] = useState(false);
  const photo = libraryPhoto(photoId);
  const bed = RHYTHM_BEDS.find((b) => b.id === bedId) ?? RHYTHM_BEDS[0];
  const feel = { on: hapticOn, volume: hapticVol };

  useFocusEffect(
    useCallback(() => {
      openTriCalm();
      setScreenOn(true);
      stopFrequencyPad();
      return () => {
        setScreenOn(false);
        stopTriCalm();
        stopFrequencyPad();
      };
    }, [])
  );

  useEffect(() => {
    if (!on) releaseAllHarmony();
  }, [on]);

  useEffect(() => {
    if (!screenOn || !on || !musicOn || musicVol <= 0.01) {
      stopRhythmBed().catch(() => {});
      return;
    }
    let alive = true;
    playRhythmBed(musicVol, rhythm, bedId)
      .then(() => {
        if (!alive) stopRhythmBed().catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
      stopRhythmBed().catch(() => {});
    };
  }, [screenOn, on, musicOn, bedId]);

  useEffect(() => {
    if (!musicOn || !on) return;
    setRhythmRate(rhythm).catch(() => {});
  }, [rhythm, musicOn, on]);

  useEffect(() => {
    if (!musicOn || !on) return;
    setRhythmVolume(musicVol);
  }, [musicVol, musicOn, on]);

  const onPressSide = useCallback(
    (side: "L" | "R") => {
      if (!on) return;
      setTimeout(() => {
        holdHarmony(side).catch(() => {});
      }, 0);
    },
    [on, hapticOn, hapticVol]
  );

  const onReleaseSide = useCallback((side: "L" | "R") => {
    releaseHarmony(side);
  }, []);

  const onReleaseAll = useCallback(() => {
    releaseAllHarmony();
  }, []);

  const nextPhoto = () => {
    const i = TRI_PHOTOS.findIndex((p) => p.id === photoId);
    const next = TRI_PHOTOS[(i + 1) % TRI_PHOTOS.length];
    if (next) setPhotoId(next.id);
  };

  const nextBed = () => {
    const i = RHYTHM_BEDS.findIndex((b) => b.id === bedId);
    const next = RHYTHM_BEDS[(i + 1) % RHYTHM_BEDS.length];
    if (next) setBedId(next.id);
  };

  const toggleVoicing = () => {
    const next: HarmonyVoicing = voicing === "dyad" ? "single" : "dyad";
    setVoicing(next);
    setHarmonyVoicing(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.waterPane}>
        <Pool
          running={on}
          photo={photo.source}
          hapticOn={hapticOn}
          hapticVol={hapticVol}
          onPressSide={onPressSide}
          onReleaseSide={onReleaseSide}
          onReleaseAll={onReleaseAll}
        />
        <LinearGradient
          colors={["rgba(244,240,230,0.22)", "transparent", "rgba(244,240,230,0.1)"]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={styles.titlePill}>
            <Text style={styles.topNotes}>
              {voicing === "single" ? "E · G bowls" : `${HARMONY_NOTES.L} · ${HARMONY_NOTES.R} bowls`}
            </Text>
            <Text style={styles.topTitle}>Touch the water anywhere</Text>
            <Text style={styles.topHint}>Hold to let both sides of the body settle.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change background photo"
            onPress={nextPhoto}
            style={styles.photoBtn}
          >
            <Ionicons name="images-outline" size={16} color={colors.ink} />
          </Pressable>
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
      </View>
      <View style={styles.controlPane} pointerEvents="box-none">
        <LinearGradient
          colors={["rgba(232,238,236,0.55)", "rgba(244,240,230,0.92)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.bottomBar} pointerEvents="box-none">
          <View style={styles.controlRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={musicOn ? "Mute background music" : "Play background music"}
              onPress={() => setMusicOn((v) => !v)}
              style={[styles.hapticChip, musicOn && styles.hapticChipOn]}
            >
              <Ionicons name={musicOn ? "musical-notes-outline" : "volume-mute-outline"} size={14} color={musicOn ? colors.linen : colors.sageDeep} />
              <Text style={[styles.hapticText, musicOn && styles.hapticTextOn]}>{musicOn ? "Music" : "Muted"}</Text>
            </Pressable>
            {musicOn ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Music bed ${bed.title}. Tap to change.`}
                  onPress={nextBed}
                  style={[styles.hapticChip, styles.hapticChipOn]}
                >
                  <Ionicons name="leaf-outline" size={14} color={colors.linen} />
                  <Text style={[styles.hapticText, styles.hapticTextOn]}>{bed.title}</Text>
                </Pressable>
                <View style={styles.volRow}>
                  <Text style={styles.volLab}>Vol</Text>
                  <Pressable onPress={() => setMusicVol((v) => Math.max(0.05, +(v - 0.05).toFixed(2)))} style={styles.nudge}>
                    <Text>-</Text>
                  </Pressable>
                  <View style={styles.volTrack}>
                    <View style={[styles.volFill, { width: `${Math.round(musicVol * 100)}%` }]} />
                  </View>
                  <Pressable onPress={() => setMusicVol((v) => Math.min(0.55, +(v + 0.05).toFixed(2)))} style={styles.nudge}>
                    <Text>+</Text>
                  </Pressable>
                </View>
                <View style={styles.volRow}>
                  <Text style={styles.volLab}>Rhythm</Text>
                  <Pressable onPress={() => setRhythm((v) => Math.max(0.92, +(v - 0.04).toFixed(2)))} style={styles.nudge}>
                    <Text>-</Text>
                  </Pressable>
                  <View style={styles.volTrack}>
                    <View style={[styles.volFill, { width: `${Math.round(((rhythm - 0.92) / 0.16) * 100)}%` }]} />
                  </View>
                  <Pressable onPress={() => setRhythm((v) => Math.min(1.08, +(v + 0.04).toFixed(2)))} style={styles.nudge}>
                    <Text>+</Text>
                  </Pressable>
                  <Text style={styles.rhythmWord}>{rhythmWord(rhythm)}</Text>
                </View>
              </>
            ) : null}
          </View>
          <View style={styles.controlRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={voicing === "dyad" ? "Bowl dyad on. Tap for single pitch." : "Single pitch on. Tap for dyad."}
              onPress={toggleVoicing}
              style={[styles.hapticChip, styles.hapticChipOn]}
            >
              <Ionicons name={voicing === "dyad" ? "git-merge-outline" : "remove-outline"} size={14} color={colors.linen} />
              <Text style={[styles.hapticText, styles.hapticTextOn]}>{voicing === "dyad" ? "Dyad" : "Single"}</Text>
            </Pressable>
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
                <Text style={styles.volLab}>Feel</Text>
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
              {on ? `${photo.title} · hold to ripple, feel, and sing` : "Paused"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Pool({
  running,
  photo,
  hapticOn,
  hapticVol,
  onPressSide,
  onReleaseSide,
  onReleaseAll,
}: {
  running: boolean;
  photo: number;
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
    const ne = e?.nativeEvent as GestureResponderEvent["nativeEvent"] & {
      touches?: ArrayLike<{ identifier?: number; locationX?: number; locationY?: number; clientX?: number; clientY?: number }>;
    };
    if (!ne) return [];
    const raw = ne.touches && ne.touches.length ? Array.from(ne.touches) : [ne];
    return raw
      .map((t, i) => ({
        id: typeof t.identifier === "number" ? t.identifier : i,
        x: typeof t.locationX === "number" ? t.locationX : "clientX" in t ? t.clientX : undefined,
        y: typeof t.locationY === "number" ? t.locationY : "clientY" in t ? t.clientY : undefined,
      }))
      .filter((t): t is Thumb => Number.isFinite(t.x) && Number.isFinite(t.y));
  };

  const onStart = (e: GestureResponderEvent) => {
    if (!running) return;
    const next = readTouches(e);
    const prev = thumbsRef.current;
    const added = next.filter((t) => !prev.has(t.id));
    thumbsRef.current = new Map(next.map((t) => [t.id, t]));
    setThumbs(next);
    const now = Date.now();
    added.forEach((t) => {
      if (now - (lastSpawnAt.current.get(t.id) ?? 0) < 50) return;
      lastSpawnAt.current.set(t.id, now);
      tapHoldPulse(sideOf(t.x), { on: hapticOn, volume: hapticVol });
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
    const ne = e?.nativeEvent as GestureResponderEvent["nativeEvent"] & {
      touches?: ArrayLike<{ identifier?: number }>;
    };
    if (!ne?.touches || ne.touches.length === 0) {
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

  return (
    <Pressable
      style={styles.pool}
      {...(Platform.OS === "web" ? { onContextMenu: blockSaveMenu } : {})}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onPressIn={(e) => {
        if (!running) return;
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        const id = typeof e.nativeEvent.identifier === "number" ? e.nativeEvent.identifier : 0;
        const now = Date.now();
        if (now - (lastSpawnAt.current.get(id) ?? 0) < 50) return;
        lastSpawnAt.current.set(id, now);
        tapHoldPulse(sideOf(x), { on: hapticOn, volume: hapticVol });
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
      onTouchStart={(e) => {
        if (!running) return;
        onStart(e);
      }}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      <Animated.Image
        source={imgSource(photo)}
        resizeMode="cover"
        pointerEvents="none"
        accessible={false}
        style={[styles.water, { transform: [{ scale: zoom }, { translateX: shift }, { translateY: -18 }] }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(244,236,220,0.18)", "rgba(231,238,242,0.04)", "rgba(125,163,179,0.12)"]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.rim} />
      {bursts.map((b) => (
        <RippleBurst key={b.id} x={b.x} y={b.y} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}
    </Pressable>
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
  waterPane: { flex: 2, overflow: "hidden", position: "relative" },
  controlPane: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  pool: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    // @ts-expect-error web: stop Save image on a hold
    WebkitTouchCallout: "none",
    userSelect: "none",
    touchAction: "none",
  },
  water: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "130%",
    left: "-10%",
    top: "-12%",
    // @ts-expect-error web: stop Save image on a hold
    WebkitTouchCallout: "none",
    userSelect: "none",
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
  topHint: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  photoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251,249,245,0.82)",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(251,249,245,0.82)",
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rhythmWord: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, minWidth: 52 },
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
