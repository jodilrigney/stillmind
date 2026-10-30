import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const hapticsSupported = Platform.OS !== "web";

export type HapticFeel = { on?: boolean; volume?: number };

function allowed(feel?: HapticFeel) {
  return (feel?.on ?? true) && (feel?.volume ?? 0.7) > 0.02;
}

function scaled(ms: number, feel?: HapticFeel) {
  const v = Math.max(0, Math.min(1, feel?.volume ?? 0.7));
  return Math.max(4, Math.round(ms * v));
}

function webVibrate(pattern: number | number[]) {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
      return true;
    }
  } catch {}
  return false;
}

function nativeStyle(feel?: HapticFeel) {
  const v = feel?.volume ?? 0.7;
  if (v < 0.34) return Haptics.ImpactFeedbackStyle.Light;
  if (v < 0.7) return Haptics.ImpactFeedbackStyle.Medium;
  return Haptics.ImpactFeedbackStyle.Heavy;
}

export async function tapLight() {
  webVibrate(10);
  if (!hapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export async function tapMedium() {
  webVibrate(16);
  if (!hapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

export async function tapHeavy() {
  if (!hapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

export async function tapSoft() {
  webVibrate(8);
  if (!hapticsSupported) return;
  try {
    await Haptics.selectionAsync();
  } catch {}
}

export async function tapSide(side: "L" | "R", feel?: HapticFeel) {
  if (!allowed(feel)) return;
  webVibrate(side === "L" ? scaled(14, feel) : scaled(22, feel));
  if (!hapticsSupported) return;
  try {
    await Haptics.impactAsync(nativeStyle(feel));
  } catch {}
}

export async function tapHoldPulse(side: "L" | "R" = "L", feel?: HapticFeel) {
  if (!allowed(feel)) return;
  webVibrate(side === "L" ? [0, scaled(8, feel)] : [0, scaled(12, feel)]);
  if (!hapticsSupported) return;
  try {
    if ((feel?.volume ?? 0.7) < 0.34) await Haptics.selectionAsync();
    else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}
