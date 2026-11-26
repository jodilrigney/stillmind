import { useFocusEffect } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

type Cb = (v: boolean) => void;
const cbs = new Set<Cb>();
let current = false;

export function setAppLandscape(v: boolean) {
  current = v;
  cbs.forEach((c) => c(v));
}

export function useAppLandscape() {
  const [v, setV] = useState(current);
  useEffect(() => {
    cbs.add(setV);
    setV(current);
    return () => {
      cbs.delete(setV);
    };
  }, []);
  return v;
}

function settle(p: unknown) {
  if (p && typeof (p as Promise<void>).then === "function") {
    (p as Promise<void>).catch(() => {});
  }
}

function unlockAll() {
  try {
    settle(ScreenOrientation.unlockAsync());
  } catch {
    /* web / unsupported devices */
  }
  try {
    settle(ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT));
  } catch {
    /* some platforms only support unlock */
  }
  if (Platform.OS !== "web") return;
  try {
    screen?.orientation?.unlock?.();
  } catch {
    /* ignore */
  }
}

export function useUnlockedOrientation() {
  useEffect(() => {
    unlockAll();
  }, []);
}

/** Desktop preview can go wide; the phone itself is never locked. */
export function useLandscapeOnFocus() {
  useFocusEffect(
    useCallback(() => {
      setAppLandscape(true);
      unlockAll();
      return () => {
        setAppLandscape(false);
        unlockAll();
      };
    }, [])
  );
}

/** Portrait by default; follows the device when the user turns the phone. */
export function useRotatableOnFocus() {
  useFocusEffect(
    useCallback(() => {
      setAppLandscape(false);
      unlockAll();
      return () => {
        setAppLandscape(false);
        unlockAll();
      };
    }, [])
  );
}
