import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { fadeOutFrequencyPad, playFrequencyPad, setFrequencyPadVolume, stopFrequencyPad, stopTone } from "../../src/audio";
import { ScreenHeader } from "../../src/components/ui";
import { MEDITATIONS } from "../../src/data";
import { ImageKey, imgSource, images } from "../../src/images";
import { useSessionAwake } from "../../src/keepAwake";
import { setSpeakVolume, speakMeditationClip, stopSpeak } from "../../src/speak";
import { colors, fonts } from "../../src/theme";

const OPEN_VOL = 0.48;
const MUSIC_END_FADE_SEC = 16;

export default function MeditationSession() {
  useSessionAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Array.isArray(id) ? id[0] : id;
  const m = MEDITATIONS.find((x) => x.id === sessionId) || MEDITATIONS[0];
  const total = m.minutes * 60;
  const [left, setLeft] = useState(total);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [musicPick, setMusicPick] = useState(m.musicId);
  const running = left > 0;
  const [volume, setVolume] = useState(OPEN_VOL);
  const [voiceVol, setVoiceVol] = useState(OPEN_VOL);
  const [dragging, setDragging] = useState(false);
  const ken = useRef(new Animated.Value(1)).current;
  const seeking = useRef(false);
  const endFade = useRef(false);
  const elapsed = Math.max(0, total - left);
  const line = Math.min(m.lines.length, Math.floor(elapsed / m.lineSeconds));
  const resting = line >= m.lines.length;
  const shown = resting ? m.rest : m.lines[line];
  const progress = total > 0 ? elapsed / total : 0;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ken, { toValue: 1.12, duration: 18000, useNativeDriver: true }),
        Animated.timing(ken, { toValue: 1, duration: 18000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ken]);

  useEffect(() => {
    endFade.current = false;
    setLeft(m.minutes * 60);
    setMusicPick(m.musicId);
    setVolume(OPEN_VOL);
    setVoiceVol(OPEN_VOL);
  }, [m.id, m.minutes, m.musicId]);

  useFocusEffect(
    useCallback(() => {
      if (musicOn) playFrequencyPad(musicPick, OPEN_VOL).catch(() => {});
      return () => {
        stopTone();
        stopFrequencyPad();
        stopSpeak();
      };
      // Start music on open at mid volume; the voice effect speaks the current line.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [m.id])
  );

  useEffect(() => {
    if (!musicOn) {
      stopFrequencyPad();
      return;
    }
    playFrequencyPad(musicPick, volume).catch(() => {});
  }, [musicOn, musicPick]);

  useEffect(() => {
    if (!running) {
      stopSpeak();
      return;
    }
    const c = setInterval(() => {
      if (seeking.current) return;
      setLeft((n) => Math.max(0, n - 1));
    }, 1000);
    return () => clearInterval(c);
  }, [running]);

  useEffect(() => {
    setSpeakVolume(voiceVol);
  }, [voiceVol]);

  useEffect(() => {
    endFade.current = false;
    setFrequencyPadVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!musicOn) {
      endFade.current = false;
      return;
    }
    if (dragging) return;
    if (left > MUSIC_END_FADE_SEC) {
      if (endFade.current) {
        endFade.current = false;
        playFrequencyPad(musicPick, volume).catch(() => {});
      }
      return;
    }
    if (endFade.current) return;
    endFade.current = true;
    fadeOutFrequencyPad(Math.max(left, MUSIC_END_FADE_SEC) * 1000);
    // volume is the level to restore if the user scrubs back from the end.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, musicOn, dragging, musicPick]);

  useEffect(() => {
    if (dragging) {
      stopSpeak();
      return;
    }
    if (!running || !voiceOn || resting) {
      stopSpeak();
      return;
    }
    speakMeditationClip(`${m.id}-${line}`, voiceVol).catch(() => {});
    // voiceVol is applied live via setSpeakVolume; don't restart the clip on volume nudges.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, running, voiceOn, m.id, resting, dragging]);

  const seekTo = (nextProgress: number) => {
    const nextElapsed = Math.max(0, Math.min(total, nextProgress * total));
    setLeft(Math.round(total - nextElapsed));
  };

  const startMusic = (id: typeof musicPick, vol = volume) => {
    setMusicPick(id);
    setMusicOn(true);
    playFrequencyPad(id, vol).catch(() => {});
  };

  const mm = clock(left);
  const elapsedLabel = clock(elapsed);
  const totalLabel = clock(total);

  return (
    <View style={{ flex: 1, backgroundColor: colors.linen, overflow: "hidden" }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: ken }] }]}>
        <ImageBackground
          source={imgSource(images[m.imageKey as ImageKey])}
          style={{ flex: 1 }}
          imageStyle={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </Animated.View>
      <LinearGradient colors={["rgba(244,240,230,0.42)", "rgba(244,240,230,0.08)", "rgba(244,240,230,0.36)"]} style={{ flex: 1 }}>
        <ScreenHeader title="MEDITATE" subtitle={m.title} />
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <View style={styles.script}>
            <Text style={styles.theme}>{resting ? "Quiet rest · music holding" : m.theme}</Text>
            <Text style={styles.time}>{mm}</Text>
            <Text style={styles.line}>{shown}</Text>
          </View>
        </View>
        <View style={styles.dock}>
          <SeekSlider
            progress={progress}
            elapsedLabel={elapsedLabel}
            totalLabel={totalLabel}
            onChange={seekTo}
            onDragChange={(drag) => {
              seeking.current = drag;
              setDragging(drag);
            }}
          />
          {m.musicChoices?.length ? (
            <View style={styles.musicPickRow}>
              {m.musicChoices.map((choice) => {
                const on = musicOn && musicPick === choice.id;
                return (
                  <Pressable
                    key={choice.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${choice.label} sleep music, ${choice.note}`}
                    onPress={() => startMusic(choice.id)}
                    style={[styles.musicChip, on && styles.musicChipOn]}
                  >
                    <Text style={[styles.musicChipLabel, on && styles.musicChipLabelOn]}>{choice.label}</Text>
                    <Text style={styles.musicChipNote}>{choice.note}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.toggleRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: musicOn }}
              style={[styles.toggle, musicOn && styles.toggleOn]}
              onPress={() => {
                if (musicOn) {
                  setMusicOn(false);
                  stopFrequencyPad();
                  return;
                }
                startMusic(musicPick);
              }}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={musicOn ? "musical-notes" : "musical-notes-outline"} size={16} color={musicOn ? colors.sageDeep : colors.muted} />
                {!musicOn ? <View style={[styles.iconSlash, { backgroundColor: colors.muted }]} /> : null}
              </View>
              <Text style={[styles.toggleText, musicOn && styles.toggleTextOn]}>Music</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: voiceOn }}
              style={[styles.toggle, voiceOn && styles.toggleOn]}
              onPress={() => {
                if (voiceOn) {
                  setVoiceOn(false);
                  stopSpeak();
                  return;
                }
                setVoiceOn(true);
                if (running && !resting) speakMeditationClip(`${m.id}-${line}`, voiceVol).catch(() => {});
              }}
            >
              <Ionicons name={voiceOn ? "mic" : "mic-off-outline"} size={16} color={voiceOn ? colors.sageDeep : colors.muted} />
              <Text style={[styles.toggleText, voiceOn && styles.toggleTextOn]}>Voice</Text>
            </Pressable>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.lab}>Music</Text>
            <Pressable onPress={() => setVolume(Math.max(0, +(volume - 0.1).toFixed(2)))} style={styles.nudge}>
              <Text>-</Text>
            </Pressable>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(volume * 100)}%` }]} />
            </View>
            <Pressable onPress={() => setVolume(Math.min(1, +(volume + 0.1).toFixed(2)))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.lab}>Voice</Text>
            <Pressable onPress={() => setVoiceVol(Math.max(0, +(voiceVol - 0.1).toFixed(2)))} style={styles.nudge}>
              <Text>-</Text>
            </Pressable>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(voiceVol * 100)}%` }]} />
            </View>
            <Pressable onPress={() => setVoiceVol(Math.min(1, +(voiceVol + 0.1).toFixed(2)))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function SeekSlider({
  progress,
  elapsedLabel,
  totalLabel,
  onChange,
  onDragChange,
}: {
  progress: number;
  elapsedLabel: string;
  totalLabel: string;
  onChange: (value: number) => void;
  onDragChange: (dragging: boolean) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const trackW = useRef(160);
  const dragging = useRef(false);
  const t = Math.max(0, Math.min(1, progress));

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
            onDragChange(true);
            e.currentTarget.setPointerCapture?.(e.nativeEvent.pointerId);
            setFromX(e.nativeEvent.offsetX);
          },
          onPointerMove: (e: { nativeEvent: { offsetX: number } }) => {
            if (!dragging.current) return;
            setFromX(e.nativeEvent.offsetX);
          },
          onPointerUp: () => {
            dragging.current = false;
            onDragChange(false);
          },
          onPointerCancel: () => {
            dragging.current = false;
            onDragChange(false);
          },
        }
      : {};

  return (
    <View style={styles.seekRow}>
      <Text style={styles.seekTime}>{elapsedLabel}</Text>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Meditation position"
        onLayout={(e) => {
          trackW.current = e.nativeEvent.layout.width;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          onDragChange(true);
          fromNative(e);
        }}
        onResponderMove={fromNative}
        onResponderRelease={() => onDragChange(false)}
        onResponderTerminate={() => onDragChange(false)}
        {...(webBind as object)}
        style={styles.seekHit}
      >
        <View style={styles.seekTrack}>
          <View style={[styles.seekFill, { width: `${Math.round(t * 100)}%` }]} />
        </View>
        <View style={[styles.seekThumb, { left: `${Math.round(t * 100)}%` }]} />
      </View>
      <Text style={styles.seekTime}>{totalLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  script: {
    backgroundColor: "rgba(251,249,245,0.46)",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  theme: { fontFamily: fonts.bodyMed, color: colors.ink, textAlign: "center", fontSize: 14, marginBottom: 8 },
  time: { fontFamily: fonts.titleLight, fontSize: 48, color: colors.ink, textAlign: "center" },
  line: {
    fontFamily: fonts.titleBold,
    fontSize: 24,
    color: colors.ink,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 32,
  },
  dock: {
    margin: 14,
    backgroundColor: "rgba(251,249,245,0.42)",
    borderRadius: 22,
    padding: 14,
    gap: 12,
  },
  toggleRow: { flexDirection: "row", gap: 8 },
  musicPickRow: { flexDirection: "row", gap: 8 },
  musicChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(237,230,216,0.72)",
  },
  musicChipOn: { backgroundColor: "rgba(215, 226, 204, 0.78)" },
  musicChipLabel: { fontFamily: fonts.titleBold, color: colors.muted, fontSize: 14 },
  musicChipLabelOn: { color: colors.sageDeep },
  musicChipNote: { fontFamily: fonts.body, color: colors.ink, fontSize: 11, marginTop: 2, opacity: 0.75 },
  seekRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  seekTime: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12, width: 36, fontVariant: ["tabular-nums"] },
  seekHit: { flex: 1, height: 28, justifyContent: "center", position: "relative" },
  seekTrack: { height: 8, borderRadius: 4, backgroundColor: colors.creamDeep, overflow: "hidden" },
  seekFill: { height: 8, backgroundColor: colors.sage },
  seekThumb: {
    position: "absolute",
    top: 6,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: colors.sageDeep,
  },
  iconWrap: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  iconSlash: {
    position: "absolute",
    width: 18,
    height: 1.7,
    borderRadius: 1,
    transform: [{ rotate: "-50deg" }],
  },
  toggle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 16,
    paddingVertical: 9,
    backgroundColor: "rgba(237,230,216,0.72)",
  },
  toggleOn: { backgroundColor: "rgba(215, 226, 204, 0.78)" },
  toggleText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 11 },
  toggleTextOn: { color: colors.sageDeep },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lab: { fontFamily: fonts.bodyMed, color: colors.ink, width: 64 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.creamDeep, overflow: "hidden" },
  fill: { height: 10, backgroundColor: colors.sage },
  nudge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.creamDeep, alignItems: "center", justifyContent: "center" },
});
