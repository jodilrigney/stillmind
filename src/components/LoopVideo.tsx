import { ResizeMode, Video } from "expo-av";
import { createElement, useEffect, useRef } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { imgSource } from "../media";

function toUri(source: unknown): string | undefined {
  if (typeof source === "string") return source;
  if (typeof source === "number") {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri;
  }
  if (source && typeof source === "object" && "uri" in source) {
    const uri = (source as { uri?: string }).uri;
    return typeof uri === "string" ? uri : undefined;
  }
  return undefined;
}

export function LoopVideo({
  source,
  poster,
}: {
  source: number | string | { uri: string };
  poster?: number | string;
}) {
  const uri = toUri(source);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = true;
    const play = () => node.play()?.catch(() => {});
    play();
    node.addEventListener("canplay", play);
    return () => node.removeEventListener("canplay", play);
  }, [uri]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {poster ? <Image source={imgSource(poster)} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {Platform.OS === "web" && uri ? (
        createElement("video", {
          ref: videoRef,
          src: uri,
          autoPlay: true,
          loop: true,
          muted: true,
          playsInline: true,
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          },
        })
      ) : (
        <Video
          source={typeof source === "number" ? source : { uri: uri || "" }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
        />
      )}
    </View>
  );
}
