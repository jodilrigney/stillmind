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

function lockLandscape() {
  try {
    settle(ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE));
  } catch {
    /* web / unsupported devices */
  }
  if (Platform.OS !== "web") return;
  try {
    const lock = screen?.orientation?.lock;
    if (typeof lock === "function") settle(lock.call(screen.orientation, "landscape"));
  } catch {
    /* browsers only allow this after a gesture / fullscreen */
  }
}

function unlockLandscape() {
  try {
    settle(ScreenOrientation.unlockAsync());
  } catch {
    /* web / unsupported devices */
  }
  if (Platform.OS !== "web") return;
  try {
    screen?.orientation?.unlock?.();
  } catch {
    /* ignore */
  }
}

export function useLandscapeOnFocus() {
  useFocusEffect(
    useCallback(() => {
      setAppLandscape(true);
      lockLandscape();
      return () => {
        setAppLandscape(false);
        unlockLandscape();
      };
    }, [])
  );
}

/** Portrait by default; follows the device when the user turns the phone. */
export function useRotatableOnFocus() {
  useFocusEffect(
    useCallback(() => {
      setAppLandscape(false);
      try {
        settle(ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT));
      } catch {
        unlockLandscape();
      }
      if (Platform.OS === "web") {
        try {
          screen?.orientation?.unlock?.();
        } catch {
          /* ignore */
        }
      }
      return () => {
        setAppLandscape(false);
        unlockLandscape();
      };
    }, [])
  );
}
