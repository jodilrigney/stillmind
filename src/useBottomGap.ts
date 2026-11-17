import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Tiny lift only when the browser reports no inset (Android 3-button). */
const ANDROID_NAV = 8;
const OVERLAY_CAP = 12;

function envSafeBottom() {
  if (typeof document === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:0;bottom:0;width:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const pad = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return Math.round(pad);
}

function visualOverlap() {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

function phoneWeb() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches;
}

export function useBottomGap() {
  const insets = useSafeAreaInsets();
  const [webGap, setWebGap] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const read = () => {
      const env = envSafeBottom();
      if (env > 0) {
        setWebGap(env);
        return;
      }
      const overlap = visualOverlap();
      if (overlap > 0) {
        setWebGap(Math.min(OVERLAY_CAP, overlap));
        return;
      }
      setWebGap(phoneWeb() ? ANDROID_NAV : 0);
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
    };
  }, []);

  if (Platform.OS !== "web") return insets.bottom;
  return webGap;
}
