import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";
import { Platform } from "react-native";

export function useSessionAwake() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const tag = "still-session";
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag);
    };
  }, []);
}
