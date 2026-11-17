import { Audio } from "expo-av";
import { Image, Platform } from "react-native";

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function toWavUri(fill: (view: DataView, n: number, sampleRate: number) => void, seconds = 6, sampleRate = 22050) {
  const n = Math.floor(sampleRate * seconds);
  const dataSize = n * 4;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  fill(view, n, sampleRate);
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function makeBilateralWavUri(opts: {
  freq: number;
  seconds?: number;
  volume?: number;
  panRate?: number;
}) {
  const seconds = opts.seconds ?? 5;
  const volume = opts.volume ?? 0.18;
  const panRate = opts.panRate ?? 0.35;
  return toWavUri((view, n, sampleRate) => {
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, t * 4, (seconds - t) * 4);
      const sample =
        (Math.sin(2 * Math.PI * opts.freq * t) * 0.7 +
          Math.sin(2 * Math.PI * opts.freq * 2 * t) * 0.18 +
          Math.sin(2 * Math.PI * opts.freq * 3.01 * t) * 0.08) *
        volume *
        env;
      const pan = (Math.sin(2 * Math.PI * panRate * t) + 1) / 2;
      view.setInt16(44 + i * 4, Math.max(-1, Math.min(1, sample * (1 - pan))) * 32767, true);
      view.setInt16(44 + i * 4 + 2, Math.max(-1, Math.min(1, sample * pan)) * 32767, true);
    }
  }, seconds);
}

export function makeBowlWavUri(opts: { freq: number; volume?: number }) {
  const volume = opts.volume ?? 0.16;
  return toWavUri((view, n, sampleRate) => {
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const beat = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.12 * t);
      const sample =
        (Math.sin(2 * Math.PI * opts.freq * t) +
          0.35 * Math.sin(2 * Math.PI * opts.freq * 2.02 * t) +
          0.16 * Math.sin(2 * Math.PI * opts.freq * 3.05 * t) +
          0.08 * Math.sin(2 * Math.PI * opts.freq * 4.1 * t)) *
        volume *
        beat;
      const pan = 0.5 + 0.18 * Math.sin(2 * Math.PI * 0.08 * t);
      view.setInt16(44 + i * 4, Math.max(-1, Math.min(1, sample * (1 - pan))) * 32767, true);
      view.setInt16(44 + i * 4 + 2, Math.max(-1, Math.min(1, sample * pan)) * 32767, true);
    }
  }, 8);
}

const BOWL_MODES = [
  { r: 1, a: 0.36, beat: 0.68 },
  { r: 2.4, a: 0.48, beat: 4.85 },
  { r: 4.01, a: 0.16, beat: 3.1 },
  { r: 5.4, a: 0.22, beat: 5.35 },
  { r: 6.82, a: 0.08, beat: 6.2 },
  { r: 9.05, a: 0.04, beat: 7.1 },
  { r: 12.2, a: 0.018, beat: 8.4 },
];

export function makeSingingBowlWavUri(opts: { freq?: number; volume?: number }) {
  const f0 = opts.freq ?? 220;
  const volume = opts.volume ?? 0.12;
  return toWavUri((view, n, sampleRate) => {
    const seconds = n / sampleRate;
    const fade = 0.7;
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      let s = 0;
      for (const p of BOWL_MODES) {
        const f = f0 * p.r;
        const env = 0.78 + 0.22 * Math.sin(2 * Math.PI * p.beat * t);
        s +=
          p.a *
          env *
          (Math.sin(2 * Math.PI * f * t) + 0.82 * Math.sin(2 * Math.PI * f * 1.0018 * t));
      }
      const swell = 0.84 + 0.16 * Math.sin(2 * Math.PI * 0.11 * t);
      const sparkle =
        0.028 * Math.sin(2 * Math.PI * f0 * 8.6 * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 5.2 * t));
      const edge = Math.min(1, t / fade, (seconds - t) / fade);
      const sample = (s * 0.2 * swell + sparkle) * volume * edge;
      const pan = 0.5 + 0.14 * Math.sin(2 * Math.PI * 0.07 * t);
      view.setInt16(44 + i * 4, Math.max(-1, Math.min(1, sample * (1 - pan))) * 32767, true);
      view.setInt16(44 + i * 4 + 2, Math.max(-1, Math.min(1, sample * pan)) * 32767, true);
    }
  }, 10);
}

function makeStrikeWavUri(freq = 220, volume = 0.2) {
  return toWavUri((view, n, sampleRate) => {
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const attack = 1 - Math.exp(-t * 90);
      const decay = Math.exp(-t * 1.45);
      let s = 0;
      for (const p of BOWL_MODES) {
        const f = freq * p.r;
        s += p.a * 1.15 * Math.sin(2 * Math.PI * f * t);
      }
      const tick = (Math.random() * 2 - 1) * Math.exp(-t * 48) * 0.12;
      const sample = (s * 0.22 * attack * decay + tick) * volume;
      view.setInt16(44 + i * 4, Math.max(-1, Math.min(1, sample)) * 32767, true);
      view.setInt16(44 + i * 4 + 2, Math.max(-1, Math.min(1, sample * 0.92)) * 32767, true);
    }
  }, 3);
}

type HarmonyVoice = {
  gain: GainNode;
  held: boolean;
};

type WebBowl = {
  ctx: AudioContext;
  master: GainNode;
  voices?: { L: HarmonyVoice; R: HarmonyVoice };
  stop: () => void;
  freq: number;
  engine?: number;
  voicing?: HarmonyVoicing;
};

/** Tuned to calm.mp3’s measured peaks: lower Em fifth on left, G/D on right. */
export const HARMONY_CHORD = {
  L: [164.6, 247.0], // E3 + B3 — lower
  R: [195.9, 293.7], // G3 + D4 — higher home fifth
} as const;

export const HARMONY_PITCH = {
  L: HARMONY_CHORD.L[0],
  R: HARMONY_CHORD.R[0],
} as const;

export const HARMONY_NOTES = {
  L: "E·B",
  R: "G·D",
} as const;

export type HarmonyVoicing = "single" | "dyad";

let harmonyVoicing: HarmonyVoicing = "dyad";

export function getHarmonyVoicing() {
  return harmonyVoicing;
}

function harmonyChord(side: "L" | "R"): readonly number[] {
  const full = HARMONY_CHORD[side];
  return harmonyVoicing === "single" ? [full[0]] : full;
}

const HARMONY_ATTACK = 0.45;
const HARMONY_FADE = 3.4;
const HARMONY_LEVEL = 0.44;
const HARMONY_ENGINE = 11;

const CALM_BOWL_MODES = [
  { r: 1, a: 0.44, beat: 0.28 },
  { r: 2.01, a: 0.2, beat: 0.41 },
  { r: 2.99, a: 0.1, beat: 0.33 },
  { r: 4.04, a: 0.05, beat: 0.22 },
];

type AudioBag = {
  gen: number;
  sounds: Set<Audio.Sound>;
  nodes: Set<HTMLMediaElement>;
  web?: WebBowl;
};

function bag(): AudioBag {
  const g = globalThis as typeof globalThis & { __stillmindAudio?: AudioBag };
  if (!g.__stillmindAudio) g.__stillmindAudio = { gen: 0, sounds: new Set(), nodes: new Set() };
  return g.__stillmindAudio;
}

function hookWebAudio() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const w = window as Window & { __stillmindAudioHooked?: boolean };
  if (w.__stillmindAudioHooked || !w.Audio) return;
  w.__stillmindAudioHooked = true;
  const Orig = w.Audio;
  const Patched = function PatchedAudio(this: HTMLAudioElement, src?: string) {
    const el = new Orig(src);
    bag().nodes.add(el);
    return el;
  };
  Patched.prototype = Orig.prototype;
  Object.setPrototypeOf(Patched, Orig);
  w.Audio = Patched as unknown as typeof w.Audio;
}

hookWebAudio();

function silenceDom() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("audio").forEach((el) => {
    try {
      el.pause();
      el.muted = true;
      el.removeAttribute("src");
      el.load();
    } catch {}
  });
}

function stopWebBowl() {
  const slot = bag();
  if (!slot.web) return;
  try {
    slot.web.stop();
  } catch {}
  slot.web = undefined;
}

export async function stopTone() {
  const slot = bag();
  slot.gen += 1;
  stopBed();
  stopWebBowl();
  resetNativeHarmony();
  const sounds = [...slot.sounds];
  slot.sounds.clear();
  await Promise.all(
    sounds.map(async (sound) => {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {}
    })
  );
  const nodes = [...slot.nodes];
  slot.nodes.clear();
  nodes.forEach((el) => {
    try {
      el.pause();
      el.muted = true;
      el.removeAttribute("src");
      el.load();
    } catch {}
  });
  silenceDom();
}

export function webNestedMp3Uri(relativeFromAssets: string, source?: unknown) {
  const fallback = `/assets/?unstable_path=./assets/${relativeFromAssets}`;
  const resolved = source === undefined ? undefined : playbackUri(source);
  if (resolved && (resolved.includes("unstable_path=") || resolved.includes(relativeFromAssets))) return resolved;
  return fallback;
}

function playbackUri(source: unknown): string | undefined {
  if (typeof source === "string") return source;
  if (typeof source === "number") return Image.resolveAssetSource(source)?.uri;
  if (source && typeof source === "object") {
    const value = source as { uri?: string; default?: unknown };
    if (typeof value.uri === "string") return value.uri;
    if (value.default !== undefined) return playbackUri(value.default);
  }
  return undefined;
}

export async function playAsset(source: number | { uri: string }, volume = 0.5) {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
  await stopTone();
  const slot = bag();
  const gen = slot.gen;
  let uri = playbackUri(source);
  const vol = Math.max(0, Math.min(1, volume));

  if (Platform.OS === "web" && uri && !uri.startsWith("data:") && !uri.startsWith("blob:") && uri.includes(".mp3") && !uri.includes("unstable_path=")) {
    const file = uri.split("/").pop()?.split("?")[0] || "forest.mp3";
    uri = `/assets/?unstable_path=./assets/audio/${file}`;
  }

  if (Platform.OS === "web" && uri && typeof window !== "undefined") {
    const el = new window.Audio(uri);
    el.loop = true;
    el.volume = vol;
    if (slot.gen !== gen) {
      el.pause();
      return;
    }
    slot.nodes.add(el);
    try {
      await el.play();
    } catch {}
    return;
  }

  const playable = uri ? { uri } : source;
  const { sound } = await Audio.Sound.createAsync(playable, { isLooping: true, volume: vol, shouldPlay: true });
  if (slot.gen !== gen) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
    return sound;
  }
  slot.sounds.add(sound);
  return sound;
}

async function playUri(uri: string, volume = 0.7) {
  return playAsset({ uri }, volume);
}

export async function playBilateralTone(opts: { freq: number; volume?: number; panRate?: number }) {
  return playUri(makeBilateralWavUri(opts), opts.volume ?? 0.65);
}

export async function playBowlTone(opts: { freq: number; volume?: number }) {
  return playUri(makeBowlWavUri(opts), opts.volume ?? 0.6);
}

export async function playRemote(uri: string, volume = 0.6) {
  return playUri(uri, volume);
}

export async function setToneVolume(volume: number) {
  const v = Math.max(0, Math.min(1, volume));
  const slot = bag();
  if (slot.web) {
    try {
      slot.web.master.gain.setTargetAtTime(v, slot.web.ctx.currentTime, 0.06);
    } catch {}
  }
  const sounds = [...slot.sounds];
  await Promise.all(
    sounds.map(async (sound) => {
      try {
        await sound.setVolumeAsync(v);
      } catch {}
    })
  );
  slot.nodes.forEach((el) => {
    try {
      el.volume = v;
    } catch {}
  });
}

function webAudioCtor() {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return w.AudioContext || w.webkitAudioContext || null;
}

async function startWebBowl(freq: number, volume: number) {
  const Ctor = webAudioCtor();
  if (!Ctor) {
    return playUri(makeSingingBowlWavUri({ freq }), volume);
  }
  const slot = bag();
  if (slot.web && slot.web.freq === freq) {
    slot.web.master.gain.setTargetAtTime(volume, slot.web.ctx.currentTime, 0.08);
    if (slot.web.ctx.state === "suspended") await slot.web.ctx.resume();
    return;
  }
  stopWebBowl();
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.55);

  const stoppers: Array<() => void> = [];
  for (const p of BOWL_MODES) {
    const f = freq * p.r;
    const osc = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    osc.type = "sine";
    oscB.type = "sine";
    osc.frequency.value = f;
    oscB.frequency.value = f * 1.0018;
    const g = ctx.createGain();
    g.gain.value = p.a * 0.22;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = p.beat;
    const lfoG = ctx.createGain();
    lfoG.gain.value = p.a * 0.05;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.11;
    const swellG = ctx.createGain();
    swellG.gain.value = p.a * 0.04;
    swell.connect(swellG);
    swellG.connect(g.gain);
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0;
    const panLfo = ctx.createOscillator();
    panLfo.frequency.value = 0.07;
    const panAmt = ctx.createGain();
    panAmt.gain.value = 0.18;
    panLfo.connect(panAmt);
    panAmt.connect(pan.pan);
    osc.connect(g);
    oscB.connect(g);
    g.connect(pan);
    pan.connect(master);
    osc.start();
    oscB.start();
    lfo.start();
    swell.start();
    panLfo.start();
    stoppers.push(() => {
      try {
        osc.stop();
        oscB.stop();
        lfo.stop();
        swell.stop();
        panLfo.stop();
      } catch {}
    });
  }

  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 3), ctx.sampleRate);
  const data = buf.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < data.length; i++) {
    brown = (brown + (Math.random() * 2 - 1) * 0.02) * 0.996;
    data[i] = brown;
  }
  noise.buffer = buf;
  noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3100;
  bp.Q.value = 2.4;
  const ng = ctx.createGain();
  ng.gain.value = 0.028;
  noise.connect(bp);
  bp.connect(ng);
  ng.connect(master);
  noise.start();
  stoppers.push(() => {
    try {
      noise.stop();
    } catch {}
  });

  const stop = () => {
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
    } catch {}
    const c = ctx;
    setTimeout(() => {
      stoppers.forEach((fn) => fn());
      c.close().catch(() => {});
    }, 140);
  };

  slot.web = { ctx, master, stop, freq };
  if (ctx.state === "suspended") await ctx.resume();
}

export async function playSingingBowl(opts?: { freq?: number; volume?: number }) {
  const freq = opts?.freq ?? 220;
  const volume = Math.max(0.05, Math.min(0.85, opts?.volume ?? 0.4));
  if (Platform.OS === "web") {
    try {
      const existing = bag().web;
      if (!existing || existing.freq !== freq) await stopTone();
      await startWebBowl(freq, volume);
      return;
    } catch {
      // fall through to wav
    }
  }
  return playUri(makeSingingBowlWavUri({ freq }), volume);
}

let strikeUriCache: string | null = null;

async function playLayered(uri: string, volume: number) {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {}
  const slot = bag();
  const gen = slot.gen;
  const { sound } = await Audio.Sound.createAsync({ uri }, { isLooping: false, volume, shouldPlay: true });
  if (slot.gen !== gen) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
    return;
  }
  slot.sounds.add(sound);
  sound.setOnPlaybackStatusUpdate((st) => {
    if (st.isLoaded && st.didJustFinish) {
      slot.sounds.delete(sound);
      sound.unloadAsync().catch(() => {});
    }
  });
}

export function strikeBowl(strength = 0.7) {
  const slot = bag();
  if (Platform.OS === "web" && slot.web) {
    const { ctx, master } = slot.web;
    const now = ctx.currentTime;
    const amt = Math.max(0.15, Math.min(1, strength));
    for (const p of BOWL_MODES) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = slot.web.freq * p.r;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, p.a * 0.38 * amt), now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 2.6);
    }
    const n = ctx.createBufferSource();
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = b;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.1 * amt, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    n.connect(hp);
    hp.connect(ng);
    ng.connect(master);
    n.start(now);
    return;
  }
  if (!strikeUriCache) strikeUriCache = makeStrikeWavUri();
  playLayered(strikeUriCache, 0.42 * strength).catch(() => {});
}

function makeCalmBowlWavUri(freqs: number | readonly number[], volume = 0.14) {
  const roots = (Array.isArray(freqs) ? freqs : [freqs]) as number[];
  return toWavUri((view, n, sampleRate) => {
    const seconds = n / sampleRate;
    const fade = 1.2;
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      let s = 0;
      roots.forEach((freq, ri) => {
        const amp = ri === 0 ? 1 : 0.72;
        for (const p of CALM_BOWL_MODES) {
          const f = freq * p.r;
          const env = 0.88 + 0.12 * Math.sin(2 * Math.PI * p.beat * t);
          s += p.a * amp * env * Math.sin(2 * Math.PI * f * t);
        }
      });
      const edge = Math.min(1, t / fade, (seconds - t) / fade);
      const sample = s * 0.18 * volume * edge;
      view.setInt16(44 + i * 4, Math.max(-1, Math.min(1, sample * 0.9)) * 32767, true);
      view.setInt16(44 + i * 4 + 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
    }
  }, 10);
}

function wireBowlVoice(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  stoppers: Array<() => void>,
  amp = 1
) {
  for (const p of CALM_BOWL_MODES) {
    const f = freq * p.r;
    const osc = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    osc.type = "sine";
    oscB.type = "sine";
    osc.frequency.value = f;
    oscB.frequency.value = f * 1.001;
    const g = ctx.createGain();
    g.gain.value = p.a * 0.2 * amp;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = p.beat;
    const lfoG = ctx.createGain();
    lfoG.gain.value = p.a * 0.03;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    osc.connect(g);
    oscB.connect(g);
    g.connect(dest);
    osc.start();
    oscB.start();
    lfo.start();
    stoppers.push(() => {
      try {
        osc.stop();
        oscB.stop();
        lfo.stop();
      } catch {}
    });
  }
}

async function ensureHarmonyEngine() {
  const slot = bag();
  if (slot.web?.voices) {
    if (
      slot.web.freq === HARMONY_PITCH.L &&
      slot.web.engine === HARMONY_ENGINE &&
      slot.web.voicing === harmonyVoicing
    ) {
      if (slot.web.ctx.state === "suspended") await slot.web.ctx.resume();
      return slot.web;
    }
    stopWebBowl();
  }
  const Ctor = webAudioCtor();
  if (!Ctor) return null;
  stopWebBowl();
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  const stoppers: Array<() => void> = [];

  const makeVoice = (freqs: readonly number[], pan: number): HarmonyVoice => {
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    panner.connect(master);
    freqs.forEach((freq, i) => wireBowlVoice(ctx, gain, freq, stoppers, i === 0 ? 1 : 0.72));
    return { gain, held: false };
  };

  const voices = {
    L: makeVoice(harmonyChord("L"), -0.38),
    R: makeVoice(harmonyChord("R"), 0.38),
  };

  const stop = () => {
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
    } catch {}
    const c = ctx;
    setTimeout(() => {
      stoppers.forEach((fn) => fn());
      c.close().catch(() => {});
    }, 160);
  };

  slot.web = {
    ctx,
    master,
    voices,
    stop,
    freq: HARMONY_PITCH.L,
    engine: HARMONY_ENGINE,
    voicing: harmonyVoicing,
  };
  if (ctx.state === "suspended") await ctx.resume();
  return slot.web;
}

let triCalmLive = false;

export async function holdHarmony(side: "L" | "R") {
  if (!triCalmLive) return;
  if (Platform.OS === "web") {
    const engine = await ensureHarmonyEngine();
    if (!triCalmLive) {
      stopWebBowl();
      return;
    }
    if (!engine?.voices) return;
    const voice = engine.voices[side];
    const now = engine.ctx.currentTime;
    voice.held = true;
    const g = voice.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.linearRampToValueAtTime(HARMONY_LEVEL, now + HARMONY_ATTACK);
    harmonyChord(side).forEach((freq, i) => {
      const osc = engine.ctx.createOscillator();
      const strikeG = engine.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const peak = i === 0 ? 0.08 : 0.055;
      strikeG.gain.setValueAtTime(0.0001, now);
      strikeG.gain.exponentialRampToValueAtTime(peak, now + 0.04);
      strikeG.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      osc.connect(strikeG);
      strikeG.connect(engine.master);
      osc.start(now);
      osc.stop(now + 2.9);
    });
    return;
  }
  await holdNativeHarmony(side);
}

export function releaseHarmony(side: "L" | "R") {
  const slot = bag();
  if (Platform.OS === "web" && slot.web?.voices) {
    const voice = slot.web.voices[side];
    const now = slot.web.ctx.currentTime;
    voice.held = false;
    const g = voice.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(0.0001, now + HARMONY_FADE);
    return;
  }
  fadeNativeHarmony(side, 0, Math.round(HARMONY_FADE * 1000));
}

export function releaseAllHarmony() {
  releaseHarmony("L");
  releaseHarmony("R");
}

type NativeVoice = {
  sound?: Audio.Sound;
  timer?: ReturnType<typeof setInterval>;
  vol: number;
};

const nativeHarmony: { L: NativeVoice; R: NativeVoice } = {
  L: { vol: 0 },
  R: { vol: 0 },
};

function resetNativeHarmony() {
  clearNativeFade("L");
  clearNativeFade("R");
  nativeHarmony.L.sound = undefined;
  nativeHarmony.R.sound = undefined;
  nativeHarmony.L.vol = 0;
  nativeHarmony.R.vol = 0;
}

function clearNativeFade(side: "L" | "R") {
  if (nativeHarmony[side].timer) {
    clearInterval(nativeHarmony[side].timer);
    nativeHarmony[side].timer = undefined;
  }
}

export function setHarmonyVoicing(mode: HarmonyVoicing) {
  if (harmonyVoicing === mode) return;
  harmonyVoicing = mode;
  stopWebBowl();
  (["L", "R"] as const).forEach((side) => {
    clearNativeFade(side);
    const sound = nativeHarmony[side].sound;
    if (sound) {
      bag().sounds.delete(sound);
      sound.stopAsync().catch(() => {});
      sound.unloadAsync().catch(() => {});
    }
    nativeHarmony[side].sound = undefined;
    nativeHarmony[side].vol = 0;
  });
}

function rampNativeHarmony(side: "L" | "R", target: number, ms: number) {
  clearNativeFade(side);
  const slot = nativeHarmony[side];
  const sound = slot.sound;
  if (!sound) return;
  const from = slot.vol;
  const steps = Math.max(8, Math.round(ms / 70));
  let i = 0;
  slot.timer = setInterval(() => {
    i += 1;
    const v = from + (target - from) * (i / steps);
    slot.vol = Math.max(0, Math.min(1, v));
    sound.setVolumeAsync(slot.vol).catch(() => {});
    if (i >= steps) clearNativeFade(side);
  }, Math.max(30, ms / steps));
}

async function holdNativeHarmony(side: "L" | "R") {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {}
  const slot = nativeHarmony[side];
  if (!slot.sound) {
    const uri = makeCalmBowlWavUri(harmonyChord(side), 0.14);
    const { sound } = await Audio.Sound.createAsync({ uri }, { isLooping: true, volume: 0, shouldPlay: true });
    slot.sound = sound;
    bag().sounds.add(sound);
  }
  rampNativeHarmony(side, HARMONY_LEVEL, Math.round(HARMONY_ATTACK * 1000));
}

function fadeNativeHarmony(side: "L" | "R", target: number, ms: number) {
  rampNativeHarmony(side, target, ms);
}

export type BedKind = "stream" | "forest" | "wind" | "calm" | "rain" | "frogs";

const BED_SR = 22050;
const BED_SECONDS = 10;
const BED_REV = 22;
const BED_ASSETS: Partial<Record<BedKind, number>> = {
  stream: require("../assets/audio/place-of-calm.mp3"),
  forest: require("../assets/audio/forest.mp3"),
  wind: require("../assets/audio/forest-wind.mp3"),
  // Meditation Impromptu 01 by Kevin MacLeod (incompetech.com), CC BY 4.0.
  calm: require("../assets/audio/meditation-impromptu-01.mp3"),
};

type BedState = {
  rev: number;
  kind: BedKind | null;
  pan: number;
  vol: number;
  ctx: AudioContext | null;
  source: AudioBufferSourceNode | null;
  panner: StereoPannerNode | null;
  filter: BiquadFilterNode | null;
  gain: GainNode | null;
  buffers: Partial<Record<BedKind, AudioBuffer>>;
  libBuffers: Partial<Record<string, AudioBuffer>>;
  clip: string | null;
  wav: Partial<Record<BedKind, string>>;
  samples: Partial<Record<BedKind, Float32Array>>;
  sound: Audio.Sound | null;
  volTimer: ReturnType<typeof setInterval> | null;
};

let bedSeq = 0;
let bedWanted = false;

function stillBed(seq: number) {
  return bedWanted && bedSeq === seq;
}

const bed: BedState = {
  rev: 0,
  kind: null,
  pan: 0,
  vol: 0.34,
  ctx: null,
  source: null,
  panner: null,
  filter: null,
  gain: null,
  buffers: {},
  libBuffers: {},
  clip: null,
  wav: {},
  samples: {},
  sound: null,
  volTimer: null,
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function onePoleLP(input: Float32Array, cutoff: number, sr: number) {
  const out = new Float32Array(input.length);
  const a = 1 / (1 + sr / (2 * Math.PI * cutoff));
  let y = 0;
  for (let i = 0; i < input.length; i++) {
    y += a * (input[i] - y);
    out[i] = y;
  }
  return out;
}

function onePoleHP(input: Float32Array, cutoff: number, sr: number) {
  const lp = onePoleLP(input, cutoff, sr);
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) out[i] = input[i] - lp[i];
  return out;
}

function band(input: Float32Array, hp: number, lp: number, sr: number) {
  return onePoleLP(onePoleHP(input, hp, sr), lp, sr);
}

function normalize(buf: Float32Array, peak = 0.38) {
  let max = 1e-6;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}

function seamless(buf: Float32Array, sr: number) {
  const fade = Math.min(buf.length >> 1, Math.floor(sr * 0.55));
  const len = buf.length - fade;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = buf[i];
  for (let i = 0; i < fade; i++) {
    const a = i / fade;
    out[i] = buf[i] * a + buf[buf.length - fade + i] * (1 - a);
  }
  return out;
}

function pinkBuf(n: number, seed: number) {
  const rand = mulberry32(seed);
  const out = new Float32Array(n);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < n; i++) {
    const white = rand() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
  }
  return out;
}

function flatten(buf: Float32Array, thresh = 0.2) {
  let env = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i]);
    env += (a > env ? 0.004 : 0.0007) * (a - env);
    buf[i] *= env > thresh ? thresh / env : 1;
  }
  return buf;
}

function makeAmbientSamples(kind: BedKind, sr = BED_SR, seconds = BED_SECONDS) {
  const n = Math.floor(sr * (seconds + 0.55));
  const out = new Float32Array(n);
  if (kind === "stream") {
    const earth = band(pinkBuf(n, 44), 40, 280, sr);
    const wind = band(pinkBuf(n, 219), 120, 900, sr);
    const canopy = band(pinkBuf(n, 673), 400, 1400, sr);
    for (let i = 0; i < n; i++) {
      const swell = 0.92 + 0.08 * Math.sin((2 * Math.PI * 0.04 * i) / sr);
      out[i] = (earth[i] * 0.55 + wind[i] * 0.35 + canopy[i] * 0.1) * swell;
    }
  } else if (kind === "rain") {
    const hiss = band(pinkBuf(n, 17), 900, 7000, sr);
    const body = band(pinkBuf(n, 81), 180, 1600, sr);
    for (let i = 0; i < n; i++) {
      const drop = ((i * 17) % 1400) < 2 ? 0.45 : 0;
      out[i] = hiss[i] * 0.62 + body[i] * 0.28 + drop;
    }
  } else if (kind === "frogs") {
    const night = band(pinkBuf(n, 33), 70, 420, sr);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const chirp = Math.sin(2 * Math.PI * 720 * t) * Math.pow(Math.max(0, Math.sin(Math.PI * ((t * 1.6) % 1))), 10);
      const chirp2 = Math.sin(2 * Math.PI * 540 * t) * Math.pow(Math.max(0, Math.sin(Math.PI * (((t + 0.4) * 1.15) % 1))), 12);
      out[i] = night[i] * 0.4 + chirp * 0.2 + chirp2 * 0.14;
    }
  } else if (kind === "forest" || kind === "calm") {
    const air = band(pinkBuf(n, 61), 80, 900, sr);
    const canopy = band(pinkBuf(n, 409), 300, 1600, sr);
    for (let i = 0; i < n; i++) out[i] = air[i] * 0.7 + canopy[i] * 0.3;
  } else {
    const air = band(pinkBuf(n, 23), 140, 1050, sr);
    const canopy = band(pinkBuf(n, 811), 450, 1900, sr);
    for (let i = 0; i < n; i++) out[i] = air[i] * 0.9 + canopy[i] * 0.1;
  }
  return normalize(seamless(flatten(out), sr), kind === "stream" ? 0.28 : 0.32);
}

function wavFromMono(samples: Float32Array, sr: number) {
  return toWavUri(
    (view, count) => {
      for (let i = 0; i < count; i++) {
        const v = Math.max(-1, Math.min(1, samples[i] ?? 0)) * 32767;
        view.setInt16(44 + i * 4, v, true);
        view.setInt16(44 + i * 4 + 2, v, true);
      }
    },
    samples.length / sr,
    sr
  );
}

function samplesFor(kind: BedKind) {
  if (!bed.samples[kind]) bed.samples[kind] = makeAmbientSamples(kind);
  return bed.samples[kind]!;
}

function wavFor(kind: BedKind) {
  if (!bed.wav[kind]) bed.wav[kind] = wavFromMono(samplesFor(kind), BED_SR);
  return bed.wav[kind]!;
}

function clampPan(v: number) {
  return Math.max(-1, Math.min(1, v));
}

function clearBedVolTimer() {
  if (bed.volTimer) {
    clearInterval(bed.volTimer);
    bed.volTimer = null;
  }
}

function applyNativeBed(volume: number, pan: number) {
  if (!bed.sound) return;
  const vol = Math.max(0, Math.min(1, volume));
  if (Platform.OS === "android") {
    bed.sound.setVolumeAsync(vol, clampPan(pan)).catch(() => {});
    return;
  }
  bed.sound.setVolumeAsync(vol).catch(() => {});
}

function applyBedPan() {
  const pan = clampPan(bed.pan);
  if (bed.panner) bed.panner.pan.value = pan;
  applyNativeBed(bed.vol, pan);
}

function applyBedVolNow(v: number) {
  bed.vol = Math.max(0, Math.min(1, v));
  if (bed.gain && bed.ctx) {
    try {
      bed.gain.gain.setValueAtTime(Math.max(0.0001, bed.vol), bed.ctx.currentTime);
    } catch {
      bed.gain.gain.value = bed.vol;
    }
  }
  applyNativeBed(bed.vol, bed.pan);
}

export function setBedPan(progressOrPan: number, ms = 0) {
  const target = clampPan(progressOrPan);
  if (ms > 0 && bed.panner && bed.ctx) {
    try {
      const now = bed.ctx.currentTime;
      bed.panner.pan.cancelScheduledValues(now);
      bed.panner.pan.setValueAtTime(bed.panner.pan.value, now);
      bed.panner.pan.linearRampToValueAtTime(target, now + ms / 1000);
    } catch {
      bed.panner.pan.value = target;
    }
    bed.pan = target;
    applyNativeBed(bed.vol, target);
    return;
  }
  bed.pan = target;
  applyBedPan();
}

export function setBedVolume(volume: number, ms = 0) {
  const target = Math.max(0, Math.min(1, volume));
  clearBedVolTimer();
  if (ms <= 0 || (!bed.gain && !bed.sound)) {
    applyBedVolNow(target);
    return;
  }
  if (bed.gain && bed.ctx) {
    const now = bed.ctx.currentTime;
    try {
      bed.gain.gain.cancelScheduledValues(now);
      bed.gain.gain.setValueAtTime(Math.max(0.0001, bed.gain.gain.value), now);
      bed.gain.gain.linearRampToValueAtTime(Math.max(0.0001, target), now + ms / 1000);
    } catch {
      bed.gain.gain.value = target;
    }
    bed.vol = target;
    return;
  }
  const from = bed.vol;
  const steps = Math.max(6, Math.round(ms / 40));
  let i = 0;
  bed.volTimer = setInterval(() => {
    i += 1;
    applyBedVolNow(from + (target - from) * (i / steps));
    if (i >= steps) clearBedVolTimer();
  }, Math.max(16, ms / steps));
}

function stopWebSource() {
  if (!bed.source) return;
  try {
    bed.source.stop();
  } catch {}
  try {
    bed.source.disconnect();
  } catch {}
  bed.source = null;
}

async function stopNativeBed() {
  const sound = bed.sound;
  bed.sound = null;
  if (!sound) return;
  try {
    await sound.stopAsync();
    await sound.unloadAsync();
  } catch {}
}

export async function pauseBed() {
  if (bed.sound) {
    try {
      await bed.sound.pauseAsync();
    } catch {}
    return;
  }
  if (bed.ctx && bed.source && bed.ctx.state === "running") {
    try {
      await bed.ctx.suspend();
    } catch {}
  }
}

export async function resumeBed() {
  if (bed.sound) {
    try {
      await bed.sound.playAsync();
    } catch {}
    return;
  }
  if (bed.ctx && bed.ctx.state === "suspended") {
    try {
      await bed.ctx.resume();
    } catch {}
  }
}

export function stopBed() {
  bedWanted = false;
  bedSeq += 1;
  clearBedVolTimer();
  bed.kind = null;
  bed.clip = null;
  stopWebSource();
  const ctx = bed.ctx;
  bed.ctx = null;
  bed.gain = null;
  bed.panner = null;
  bed.filter = null;
  if (ctx) {
    try {
      void ctx.suspend();
    } catch {}
    ctx.close().catch(() => {});
  }
  stopNativeBed().catch(() => {});
}

/** Lighten stream/forest/wind only — leaves Calm/Morning/Flow beds alone. */
export function stopPannedBed() {
  if (bed.clip) return;
  if (bed.kind || bed.source || bed.sound || bed.ctx) stopBed();
}

function bedAssetUri(kind: BedKind) {
  const asset = BED_ASSETS[kind];
  if (asset == null) return undefined;
  let uri = playbackUri(asset);
  if (Platform.OS === "web" && uri && uri.includes(".mp3") && !uri.includes("unstable_path=")) {
    const nested = uri.match(/audio\/freq\/[^/?]+\.mp3/);
    if (nested) return `/assets/?unstable_path=./assets/${nested[0]}`;
    const file = uri.split("/").pop()?.split("?")[0] || "";
    uri = `/assets/?unstable_path=./assets/audio/${file}`;
  }
  return uri;
}

function mixToMono(ctx: AudioContext, buf: AudioBuffer) {
  if (buf.numberOfChannels < 2) return buf;
  const n = buf.length;
  const mono = ctx.createBuffer(1, n, buf.sampleRate);
  const out = mono.getChannelData(0);
  const left = buf.getChannelData(0);
  const right = buf.getChannelData(1);
  for (let i = 0; i < n; i++) out[i] = (left[i] + right[i]) * 0.5;
  return mono;
}

async function loadWebBuffer(kind: BedKind, ctx: AudioContext) {
  if (bed.buffers[kind]) return bed.buffers[kind]!;
  const uri = bedAssetUri(kind);
  if (!uri) return null;
  const res = await fetch(uri);
  if (!res.ok) return null;
  const data = await res.arrayBuffer();
  const decoded = await ctx.decodeAudioData(data.slice(0));
  const buf = kind === "calm" ? decoded : mixToMono(ctx, decoded);
  bed.buffers[kind] = buf;
  return buf;
}

async function startWebBed(kind: BedKind, volume: number, seq: number) {
  const Ctor = webAudioCtor();
  if (!Ctor) return false;
  if (!stillBed(seq)) return false;
  if (!bed.ctx) {
    bed.ctx = new Ctor();
    bed.gain = bed.ctx.createGain();
    bed.panner = bed.ctx.createStereoPanner();
    bed.filter = bed.ctx.createBiquadFilter();
    bed.filter.connect(bed.panner);
    bed.panner.connect(bed.gain);
    bed.gain.connect(bed.ctx.destination);
  }
  const ctx = bed.ctx;
  if (ctx.state === "suspended") await ctx.resume();
  if (!stillBed(seq)) {
    if (ctx.state === "running") ctx.suspend().catch(() => {});
    return false;
  }
  const generated = kind === "rain" || kind === "frogs";
  const recorded = generated ? null : await loadWebBuffer(kind, ctx);
  if (!stillBed(seq)) {
    if (ctx.state === "running") ctx.suspend().catch(() => {});
    return false;
  }
  if (!recorded) {
    const samples = samplesFor(kind);
    const buf = ctx.createBuffer(1, samples.length, BED_SR);
    buf.getChannelData(0).set(samples);
    bed.buffers[kind] = buf;
  }
  if (bed.filter) {
    bed.filter.type = "lowpass";
    bed.filter.Q.value = 0.45;
    bed.filter.frequency.value =
      kind === "calm" ? 16000 : kind === "stream" ? 12000 : kind === "forest" ? 4200 : kind === "rain" ? 8000 : kind === "frogs" ? 2600 : 1800;
  }
  if (!stillBed(seq) || bed.ctx !== ctx || ctx.state === "closed") return false;
  stopWebSource();
  const source = ctx.createBufferSource();
  source.buffer = bed.buffers[kind]!;
  source.loop = true;
  source.connect(bed.filter ?? bed.panner!);
  bed.gain!.gain.value = Math.max(0.0001, volume);
  bed.panner!.pan.value = clampPan(bed.pan);
  bed.source = source;
  if (!stillBed(seq) || bed.ctx !== ctx) {
    stopWebSource();
    return false;
  }
  try {
    source.start();
  } catch {
    stopWebSource();
    return false;
  }
  if (!stillBed(seq)) {
    stopWebSource();
    return false;
  }
  bed.kind = kind;
  bed.vol = volume;
  return true;
}

async function startNativeBed(kind: BedKind, volume: number, seq: number) {
  await stopNativeBed();
  if (!stillBed(seq)) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {}
  if (!stillBed(seq)) return;
  const file = BED_ASSETS[kind];
  const { sound } = await Audio.Sound.createAsync(file ?? { uri: wavFor(kind) }, {
    isLooping: true,
    volume,
    shouldPlay: true,
    progressUpdateIntervalMillis: 500,
    ...(Platform.OS === "android"
      ? { androidImplementation: "MediaPlayer", audioPan: clampPan(bed.pan) }
      : {}),
  });
  if (!stillBed(seq)) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
    return;
  }
  bed.sound = sound;
  bed.kind = kind;
  bed.vol = volume;
}

export function isBedPlaying() {
  return !!(bed.source || bed.sound);
}

export async function playPannedBed(kind: BedKind, volume = 0.34) {
  if (bed.rev !== BED_REV) {
    stopWebSource();
    await stopNativeBed();
    if (bed.ctx) {
      try {
        bed.ctx.close();
      } catch {}
    }
    bed.ctx = null;
    bed.gain = null;
    bed.panner = null;
    bed.filter = null;
    bed.buffers = {};
    bed.libBuffers = {};
    bed.clip = null;
    bed.samples = {};
    bed.wav = {};
    bed.kind = null;
    bed.rev = BED_REV;
  }
  if (bed.kind === kind && (bed.source || bed.sound) && bedWanted) {
    setBedVolume(volume, 120);
    applyBedPan();
    if (bed.ctx?.state === "suspended") bed.ctx.resume().catch(() => {});
    return;
  }
  bedWanted = true;
  const seq = ++bedSeq;
  bed.vol = volume;
  bed.clip = null;
  if (Platform.OS === "web") {
    try {
      const ok = await startWebBed(kind, volume, seq);
      if (ok || !stillBed(seq)) return;
    } catch {
      /* fall through to wav */
    }
  }
  if (!stillBed(seq)) return;
  await startNativeBed(kind, volume, seq);
}

/** The downloaded pieces. None has a steady pulse, so they are named by feel rather than BPM. */
export const LIBRARY_TRACKS = [
  { id: "calming-zen", title: "Calm", file: "audio/library/calming-zen.mp3" },
  { id: "morning", title: "Morning", file: "audio/library/morning.mp3" },
  { id: "soft", title: "Flow", file: "audio/library/soft-meditation.mp3" },
] as const;

export type LibraryTrackId = (typeof LIBRARY_TRACKS)[number]["id"];

const LIBRARY_ASSETS: Record<LibraryTrackId, number> = {
  "calming-zen": require("../assets/audio/library/calming-zen.mp3"),
  morning: require("../assets/audio/library/morning.mp3"),
  soft: require("../assets/audio/library/soft-meditation.mp3"),
};

export async function playLibraryBed(id: LibraryTrackId, volume = 0.34) {
  if (bed.rev !== BED_REV) {
    stopWebSource();
    await stopNativeBed();
    if (bed.ctx) {
      try {
        bed.ctx.close();
      } catch {}
    }
    bed.ctx = null;
    bed.gain = null;
    bed.panner = null;
    bed.filter = null;
    bed.buffers = {};
    bed.libBuffers = {};
    bed.samples = {};
    bed.wav = {};
    bed.kind = null;
    bed.clip = null;
    bed.rev = BED_REV;
  }
  if (bed.clip === id && (bed.source || bed.sound) && bedWanted) {
    setBedVolume(volume, 120);
    applyBedPan();
    if (bed.ctx?.state === "suspended") bed.ctx.resume().catch(() => {});
    return;
  }
  const track = LIBRARY_TRACKS.find((item) => item.id === id);
  if (!track) return;
  const asset = LIBRARY_ASSETS[id];
  bedWanted = true;
  const seq = ++bedSeq;
  bed.vol = volume;
  bed.kind = null;
  bed.clip = id;
  if (Platform.OS === "web") {
    const Ctor = webAudioCtor();
    if (Ctor) {
      if (!bed.ctx) bed.ctx = new Ctor();
      const ctx = bed.ctx;
      if (ctx.state === "suspended") await ctx.resume();
      if (!stillBed(seq)) {
        if (ctx.state === "running") ctx.suspend().catch(() => {});
        return;
      }
      if (!bed.gain || !bed.panner || !bed.filter) {
        bed.gain = ctx.createGain();
        bed.panner = ctx.createStereoPanner();
        bed.filter = ctx.createBiquadFilter();
        bed.filter.connect(bed.panner);
        bed.panner.connect(bed.gain);
        bed.gain.connect(ctx.destination);
      }
      let buf = bed.libBuffers[id];
      if (!buf) {
        const uri = webNestedMp3Uri(track.file, asset);
        const res = await fetch(uri);
        if (res.ok) {
          const decoded = await ctx.decodeAudioData((await res.arrayBuffer()).slice(0));
          buf = mixToMono(ctx, decoded);
          bed.libBuffers[id] = buf;
        }
      }
      if (!stillBed(seq)) {
        if (ctx.state === "running") ctx.suspend().catch(() => {});
        return;
      }
      const filter = bed.filter;
      const gain = bed.gain;
      const panner = bed.panner;
      if (buf && filter && gain && panner) {
        filter.type = "lowpass";
        filter.Q.value = 0.45;
        filter.frequency.value = 16000;
        if (!stillBed(seq) || bed.ctx !== ctx || ctx.state === "closed") return;
        stopWebSource();
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.loop = true;
        source.connect(filter);
        gain.gain.value = Math.max(0.0001, volume);
        panner.pan.value = clampPan(bed.pan);
        bed.source = source;
        if (!stillBed(seq) || bed.ctx !== ctx) {
          stopWebSource();
          return;
        }
        try {
          source.start();
        } catch {
          stopWebSource();
          return;
        }
        return;
      }
    }
  }
  if (!stillBed(seq)) return;
  await stopNativeBed();
  if (!stillBed(seq)) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {}
  if (!stillBed(seq)) return;
  const { sound } = await Audio.Sound.createAsync(asset, {
    isLooping: true,
    volume,
    shouldPlay: true,
    ...(Platform.OS === "android"
      ? { androidImplementation: "MediaPlayer", audioPan: clampPan(bed.pan) }
      : {}),
  });
  if (!stillBed(seq)) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
    return;
  }
  bed.sound = sound;
  bed.vol = volume;
}

/** Layered meditative beds centered on each solfeggio Hz, plus the warmer library pieces. */
export const FREQUENCY_CLIPS = [
  { id: "calming-zen", title: "Calm", heals: "Soft zen", note: "Quiet and steady", file: "audio/library/calming-zen.mp3" },
  { id: "morning", title: "Morning", heals: "Fresh start", note: "Gentle morning", file: "audio/library/morning.mp3" },
  { id: "soft", title: "Flow", heals: "A lighter mood", note: "Bright and kind", file: "audio/library/soft-meditation.mp3" },
  { id: "174", hz: 174, title: "174 Hz", heals: "Ease the body", note: "Comfort & grounding" },
  { id: "396", hz: 396, title: "396 Hz", heals: "Soften fear", note: "Release & settle" },
  { id: "528", hz: 528, title: "528 Hz", heals: "Heart & repair", note: "Love frequency" },
  { id: "639", hz: 639, title: "639 Hz", heals: "Connection", note: "Heart relationships" },
  { id: "741", hz: 741, title: "741 Hz", heals: "Clarity", note: "Clear expression" },
  { id: "852", hz: 852, title: "852 Hz", heals: "Inner sight", note: "Quiet awareness" },
] as const;

export type FrequencyClipId = (typeof FREQUENCY_CLIPS)[number]["id"];

/** Siarhei Korbut — Meditation Frequencies (Jamendo / CC BY-NC-ND 3.0). */
const FREQ_ASSETS: Record<FrequencyClipId, number> = {
  "calming-zen": require("../assets/audio/library/calming-zen.mp3"),
  morning: require("../assets/audio/library/morning.mp3"),
  soft: require("../assets/audio/library/soft-meditation.mp3"),
  "174": require("../assets/audio/freq/174.mp3"),
  "396": require("../assets/audio/freq/396.mp3"),
  "528": require("../assets/audio/freq/528.mp3"),
  "639": require("../assets/audio/freq/639.mp3"),
  "741": require("../assets/audio/freq/741.mp3"),
  "852": require("../assets/audio/freq/852.mp3"),
};

let freqSound: Audio.Sound | null = null;
let webFreq: HTMLAudioElement | null = null;
let freqPlayingId: string | null = null;
let freqSeq = 0;
let freqVol = 0.28;
let freqFadeSeq = 0;
let freqFadeInterval: ReturnType<typeof setInterval> | null = null;
let freqFadeRaf: number | null = null;

function silenceFreqNow() {
  if (webFreq) {
    const el = webFreq;
    webFreq = null;
    try {
      el.pause();
      el.removeAttribute("src");
      el.load();
    } catch {}
  }
  if (freqSound) {
    const s = freqSound;
    freqSound = null;
    s.stopAsync().catch(() => {});
    s.unloadAsync().catch(() => {});
  }
}

function cancelFreqFade() {
  freqFadeSeq += 1;
  if (freqFadeInterval != null) {
    clearInterval(freqFadeInterval);
    freqFadeInterval = null;
  }
  if (freqFadeRaf != null && typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(freqFadeRaf);
    freqFadeRaf = null;
  }
}

function applyFreqVol(vol: number) {
  const next = Math.max(0, Math.min(1, vol));
  freqVol = next;
  if (webFreq) webFreq.volume = next;
  if (freqSound) freqSound.setVolumeAsync(next).catch(() => {});
}

/** Ease the pad to silence, then stop it so the end of a session is not a hard cut. */
export function fadeOutFrequencyPad(ms = 16000) {
  const duration = Math.max(1200, ms);
  const elVol = webFreq && Number.isFinite(webFreq.volume) ? webFreq.volume : freqVol;
  const start = Math.max(0, elVol);
  if (start <= 0.001 || (!webFreq && !freqSound)) {
    void stopFrequencyPad();
    return;
  }
  const seq = ++freqFadeSeq;
  if (freqFadeInterval != null) {
    clearInterval(freqFadeInterval);
    freqFadeInterval = null;
  }
  if (freqFadeRaf != null && typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(freqFadeRaf);
    freqFadeRaf = null;
  }
  const t0 = Date.now();
  const tick = () => {
    if (seq !== freqFadeSeq) return;
    const p = Math.min(1, (Date.now() - t0) / duration);
    applyFreqVol(start * 0.5 * (1 + Math.cos(Math.PI * p)));
    if (p >= 1) {
      freqFadeInterval = null;
      freqFadeRaf = null;
      freqSeq += 1;
      freqPlayingId = null;
      silenceFreqNow();
      return;
    }
    if (Platform.OS === "web" && typeof requestAnimationFrame !== "undefined") {
      freqFadeRaf = requestAnimationFrame(tick);
    }
  };
  if (Platform.OS === "web" && typeof requestAnimationFrame !== "undefined") {
    freqFadeRaf = requestAnimationFrame(tick);
    return;
  }
  freqFadeInterval = setInterval(tick, 80);
}

export async function stopFrequencyPad() {
  cancelFreqFade();
  freqSeq += 1;
  freqPlayingId = null;
  silenceFreqNow();
}

export async function playFrequencyPad(idOrHz: FrequencyClipId | number, volume = 0.28) {
  const vol = Math.max(0.04, Math.min(0.7, volume));
  const clip =
    typeof idOrHz === "number"
      ? FREQUENCY_CLIPS.find((c) => "hz" in c && c.hz === idOrHz)
      : FREQUENCY_CLIPS.find((c) => c.id === idOrHz);
  if (!clip) return;
  if (freqPlayingId === clip.id && (webFreq || freqSound)) {
    setFrequencyPadVolume(vol);
    return;
  }
  cancelFreqFade();
  const seq = ++freqSeq;
  silenceFreqNow();
  freqPlayingId = clip.id;
  const asset = FREQ_ASSETS[clip.id];

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const uri = webNestedMp3Uri("file" in clip ? clip.file : `audio/freq/${clip.id}.mp3`, asset);
    const el = new window.Audio(uri);
    el.loop = true;
    el.preload = "auto";
    el.volume = vol;
    freqVol = vol;
    webFreq = el;
    const start = () => {
      if (seq !== freqSeq || webFreq !== el) {
        el.pause();
        return;
      }
      el.play().catch(() => {});
    };
    el.addEventListener("canplay", start, { once: true });
    if (seq !== freqSeq) {
      silenceFreqNow();
      return;
    }
    start();
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {}
  if (seq !== freqSeq) return;
  const { sound } = await Audio.Sound.createAsync(asset, {
    isLooping: true,
    volume: vol,
    shouldPlay: true,
  });
  if (seq !== freqSeq) {
    sound.stopAsync().catch(() => {});
    sound.unloadAsync().catch(() => {});
    return;
  }
  freqSound = sound;
  freqVol = vol;
}

export function frequencyPadProgress() {
  if (webFreq && Number.isFinite(webFreq.duration) && webFreq.duration > 0) {
    return { position: webFreq.currentTime, duration: webFreq.duration };
  }
  return null;
}

export async function readFrequencyPadProgress() {
  const web = frequencyPadProgress();
  if (web) return web;
  if (!freqSound) return null;
  try {
    const status = await freqSound.getStatusAsync();
    if (status.isLoaded && status.durationMillis) {
      return { position: status.positionMillis / 1000, duration: status.durationMillis / 1000 };
    }
  } catch {}
  return null;
}

export async function seekFrequencyPad(ratio: number) {
  const t = Math.max(0, Math.min(0.995, ratio));
  if (webFreq && Number.isFinite(webFreq.duration) && webFreq.duration > 0) {
    webFreq.currentTime = t * webFreq.duration;
    return;
  }
  if (!freqSound) return;
  try {
    const status = await freqSound.getStatusAsync();
    if (status.isLoaded && status.durationMillis) {
      await freqSound.setPositionAsync(t * status.durationMillis);
    }
  } catch {}
}

export function setFrequencyPadVolume(volume: number) {
  cancelFreqFade();
  applyFreqVol(Math.max(0, Math.min(0.7, volume)));
}

/** Zen beds in Em/G so Tri-Calm bowls stay consonant. Ember is a steady drone, no chorus waver. */
export const RHYTHM_BEDS = [
  { id: "still", title: "Still", source: require("../assets/audio/calm.mp3") },
  { id: "ember", title: "Ember", source: require("../assets/audio/ember-drone.wav") },
] as const;

export type RhythmBedId = (typeof RHYTHM_BEDS)[number]["id"];

let rhythmSound: Audio.Sound | null = null;
let rhythmRate = 1;
let rhythmVol = 0.2;
let rhythmBedId: RhythmBedId = "still";
let rhythmSeq = 0;

async function silenceSound(sound: Audio.Sound | null) {
  if (!sound) return;
  try {
    await sound.setStatusAsync({ shouldPlay: false, volume: 0, isLooping: false });
  } catch {}
  try {
    await sound.stopAsync();
  } catch {}
  try {
    await sound.unloadAsync();
  } catch {}
}

function stopNativeHarmonySounds() {
  (["L", "R"] as const).forEach((side) => {
    clearNativeFade(side);
    const sound = nativeHarmony[side].sound;
    nativeHarmony[side].sound = undefined;
    nativeHarmony[side].vol = 0;
    if (!sound) return;
    bag().sounds.delete(sound);
    silenceSound(sound).catch(() => {});
  });
}

/** Tri-Calm music and bowls. Safe to call from any other screen. */
export function stopTriCalm() {
  triCalmLive = false;
  rhythmSeq += 1;
  const s = rhythmSound;
  rhythmSound = null;
  silenceSound(s).catch(() => {});
  const slot = bag();
  if (slot.web?.ctx && slot.web.ctx.state === "running") {
    slot.web.ctx.suspend().catch(() => {});
  }
  stopWebBowl();
  stopNativeHarmonySounds();
}

export function openTriCalm() {
  triCalmLive = true;
}

export async function stopRhythmBed() {
  rhythmSeq += 1;
  const s = rhythmSound;
  rhythmSound = null;
  await silenceSound(s);
}

export async function playRhythmBed(volume = 0.26, rate = 1, bedId: RhythmBedId = rhythmBedId) {
  if (!triCalmLive) return;
  const seq = ++rhythmSeq;
  const prev = rhythmSound;
  rhythmSound = null;
  silenceSound(prev).catch(() => {});
  rhythmVol = Math.max(0.04, Math.min(0.65, volume));
  // Keep near natural speed — heavy time-stretch makes the bed waver.
  rhythmRate = Math.max(0.92, Math.min(1.08, rate));
  rhythmBedId = RHYTHM_BEDS.some((b) => b.id === bedId) ? bedId : "still";
  const asset = RHYTHM_BEDS.find((b) => b.id === rhythmBedId)?.source ?? RHYTHM_BEDS[0].source;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {}
  if (!triCalmLive || seq !== rhythmSeq) return;
  const { sound } = await Audio.Sound.createAsync(asset, {
    isLooping: true,
    volume: rhythmVol,
    shouldPlay: true,
    rate: rhythmRate,
    shouldCorrectPitch: true,
  });
  if (!triCalmLive || seq !== rhythmSeq) {
    await silenceSound(sound);
    return;
  }
  rhythmSound = sound;
  try {
    await sound.setRateAsync(rhythmRate, true);
  } catch {}
}

export async function setRhythmRate(rate: number) {
  rhythmRate = Math.max(0.92, Math.min(1.08, rate));
  if (rhythmSound) {
    try {
      await rhythmSound.setRateAsync(rhythmRate, true);
    } catch {}
  }
}

export function setRhythmVolume(volume: number) {
  rhythmVol = Math.max(0, Math.min(0.65, volume));
  if (rhythmSound) rhythmSound.setVolumeAsync(rhythmVol).catch(() => {});
}
