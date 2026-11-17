import { Audio } from "expo-av";
import { Platform } from "react-native";
import { webNestedMp3Uri } from "./audio";

const SOOTHING = { rate: 0.62, pitch: 0.82 };

const EFT_CLIPS: Record<string, number> = {
  karate: require("../assets/audio/eft/karate.mp3"),
  brow: require("../assets/audio/eft/brow.mp3"),
  sideEye: require("../assets/audio/eft/sideEye.mp3"),
  underEye: require("../assets/audio/eft/underEye.mp3"),
  nose: require("../assets/audio/eft/nose.mp3"),
  chin: require("../assets/audio/eft/chin.mp3"),
  collar: require("../assets/audio/eft/collar.mp3"),
  underArm: require("../assets/audio/eft/underArm.mp3"),
  crown: require("../assets/audio/eft/crown.mp3"),
};

const MEDITATION_CLIPS: Record<string, number> = {
  "anxiety-0": require("../assets/audio/meditate/anxiety-0.mp3"),
  "anxiety-1": require("../assets/audio/meditate/anxiety-1.mp3"),
  "anxiety-2": require("../assets/audio/meditate/anxiety-2.mp3"),
  "anxiety-3": require("../assets/audio/meditate/anxiety-3.mp3"),
  "anxiety-4": require("../assets/audio/meditate/anxiety-4.mp3"),
  "anxiety-5": require("../assets/audio/meditate/anxiety-5.mp3"),
  "anxiety-6": require("../assets/audio/meditate/anxiety-6.mp3"),
  "grounding-0": require("../assets/audio/meditate/grounding-0.mp3"),
  "grounding-1": require("../assets/audio/meditate/grounding-1.mp3"),
  "grounding-2": require("../assets/audio/meditate/grounding-2.mp3"),
  "grounding-3": require("../assets/audio/meditate/grounding-3.mp3"),
  "grounding-4": require("../assets/audio/meditate/grounding-4.mp3"),
  "grounding-5": require("../assets/audio/meditate/grounding-5.mp3"),
  "grounding-6": require("../assets/audio/meditate/grounding-6.mp3"),
  "sleep-0": require("../assets/audio/meditate/sleep-0.mp3"),
  "sleep-1": require("../assets/audio/meditate/sleep-1.mp3"),
  "sleep-2": require("../assets/audio/meditate/sleep-2.mp3"),
  "sleep-3": require("../assets/audio/meditate/sleep-3.mp3"),
  "sleep-4": require("../assets/audio/meditate/sleep-4.mp3"),
  "sleep-5": require("../assets/audio/meditate/sleep-5.mp3"),
  "sleep-6": require("../assets/audio/meditate/sleep-6.mp3"),
  "stress-0": require("../assets/audio/meditate/stress-0.mp3"),
  "stress-1": require("../assets/audio/meditate/stress-1.mp3"),
  "stress-2": require("../assets/audio/meditate/stress-2.mp3"),
  "stress-3": require("../assets/audio/meditate/stress-3.mp3"),
  "stress-4": require("../assets/audio/meditate/stress-4.mp3"),
  "stress-5": require("../assets/audio/meditate/stress-5.mp3"),
  "stress-6": require("../assets/audio/meditate/stress-6.mp3"),
  "body-scan-0": require("../assets/audio/meditate/body-scan-0.mp3"),
  "body-scan-1": require("../assets/audio/meditate/body-scan-1.mp3"),
  "body-scan-2": require("../assets/audio/meditate/body-scan-2.mp3"),
  "body-scan-3": require("../assets/audio/meditate/body-scan-3.mp3"),
  "body-scan-4": require("../assets/audio/meditate/body-scan-4.mp3"),
  "body-scan-5": require("../assets/audio/meditate/body-scan-5.mp3"),
  "body-scan-6": require("../assets/audio/meditate/body-scan-6.mp3"),
  "body-scan-7": require("../assets/audio/meditate/body-scan-7.mp3"),
  "kindness-0": require("../assets/audio/meditate/kindness-0.mp3"),
  "kindness-1": require("../assets/audio/meditate/kindness-1.mp3"),
  "kindness-2": require("../assets/audio/meditate/kindness-2.mp3"),
  "kindness-3": require("../assets/audio/meditate/kindness-3.mp3"),
  "kindness-4": require("../assets/audio/meditate/kindness-4.mp3"),
  "kindness-5": require("../assets/audio/meditate/kindness-5.mp3"),
  "kindness-6": require("../assets/audio/meditate/kindness-6.mp3"),
  "kindness-7": require("../assets/audio/meditate/kindness-7.mp3"),
};

let voiceSound: Audio.Sound | null = null;
let webVoice: { pause: () => void; play?: () => Promise<void>; removeAttribute: (name: string) => void; volume: number } | null = null;
const webVoiceEls: { pause: () => void; removeAttribute: (name: string) => void; load?: () => void }[] = [];
let speakVol = 0.78;
let voiceClipId: string | null = null;
let voiceSeq = 0;

function clampVol(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function setSpeakVolume(volume: number) {
  speakVol = clampVol(volume);
  if (webVoice) webVoice.volume = speakVol;
  if (voiceSound) voiceSound.setVolumeAsync(speakVol).catch(() => {});
}

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const rank = (v: SpeechSynthesisVoice) => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    if (/sonia|moira|karen|serena|tessa|fiona|samantha/.test(n)) return 0;
    if (/linda|aria|jenny|zira|natasha|google uk english female/.test(n)) return 1;
    if (v.lang.startsWith("en") && /female|woman/.test(n)) return 2;
    if (v.lang.startsWith("en-GB") || v.lang.startsWith("en-AU") || v.lang.startsWith("en-CA")) return 3;
    if (v.lang.startsWith("en")) return 4;
    return 9;
  };
  return [...voices].sort((a, b) => rank(a) - rank(b))[0];
}

function silenceVoicesNow() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (webVoice) {
    const el = webVoice;
    webVoice = null;
    try {
      el.pause();
      el.removeAttribute("src");
    } catch {}
  }
  while (webVoiceEls.length) {
    const el = webVoiceEls.pop();
    if (!el) continue;
    try {
      el.pause();
      el.removeAttribute("src");
      el.load?.();
    } catch {}
  }
  if (voiceSound) {
    const s = voiceSound;
    voiceSound = null;
    s.stopAsync().catch(() => {});
    s.unloadAsync().catch(() => {});
  }
}

export async function stopSpeak() {
  voiceSeq += 1;
  voiceClipId = null;
  silenceVoicesNow();
}

function speakWebFallback(text: string, volume: number) {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = SOOTHING.rate;
    u.pitch = SOOTHING.pitch;
    u.volume = clampVol(volume);
    const voice = pickVoice(synth.getVoices());
    if (voice) u.voice = voice;
    synth.speak(u);
  };
  if (synth.getVoices().length === 0) {
    synth.addEventListener("voiceschanged", speak, { once: true });
  }
  speak();
}

/** Soft neural guidance clip for an EFT point; falls back to a very gentle system voice. */
export async function speakSoothing(text: string, pointId?: string, volume = speakVol) {
  await stopSpeak();
  const vol = clampVol(volume);
  speakVol = vol;
  if (vol <= 0.01) return;
  const clip = pointId ? EFT_CLIPS[pointId] ?? MEDITATION_CLIPS[pointId] : undefined;
  if (clip) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(clip, { volume: vol, shouldPlay: true });
      voiceSound = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) {
          if (voiceSound === sound) voiceSound = null;
          sound.unloadAsync().catch(() => {});
        }
      });
      return;
    } catch {
      // fall through
    }
  }
  speakWebFallback(text, vol);
}

/** Bundled SoniaNeural clips only — never the robotic system voice. */
export async function speakMeditationClip(clipId: string, volume = speakVol) {
  const vol = clampVol(volume);
  speakVol = vol;
  const seq = ++voiceSeq;
  silenceVoicesNow();
  if (vol <= 0.01) {
    voiceClipId = null;
    return;
  }
  voiceClipId = clipId;
  const clip = MEDITATION_CLIPS[clipId];
  if (!clip) {
    if (seq === voiceSeq) voiceClipId = null;
    return;
  }
  if (seq !== voiceSeq) return;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const uri = webNestedMp3Uri(`audio/meditate/${clipId}.mp3`, clip);
    const el = new window.Audio(uri);
    el.preload = "auto";
    el.volume = vol;
    webVoice = el;
    webVoiceEls.push(el);
    const tryPlay = () => {
      if (seq !== voiceSeq || webVoice !== el) {
        try {
          el.pause();
        } catch {}
        return;
      }
      el.play().catch(() => {});
    };
    el.addEventListener("canplay", tryPlay, { once: true });
    el.addEventListener("ended", () => {
      if (webVoice === el) webVoice = null;
    });
    tryPlay();
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    if (seq !== voiceSeq) return;
    const { sound } = await Audio.Sound.createAsync(clip, { volume: vol, shouldPlay: true });
    if (seq !== voiceSeq) {
      sound.stopAsync().catch(() => {});
      sound.unloadAsync().catch(() => {});
      return;
    }
    voiceSound = sound;
    sound.setOnPlaybackStatusUpdate((st) => {
      if (st.isLoaded && st.didJustFinish) {
        if (voiceSound === sound) voiceSound = null;
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {}
}
