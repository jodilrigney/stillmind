import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export function useLoop(duration: number, reset = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, reset]);
  return v;
}

export function useOscillate(duration: number, reset = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, reset]);
  return v;
}

/** Seamless horizontal current: repeating streaks that never jump. */
export function CurrentStreaks({ speed = 1 }: { speed?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Streak key={i} index={i} speed={speed} />
      ))}
    </View>
  );
}

function Streak({ index, speed }: { index: number; speed: number }) {
  const t = useLoop(9000 / Math.max(0.25, speed) + index * 700, speed);
  const x = t.interpolate({ inputRange: [0, 1], outputRange: [-200, 460] });
  const y = 28 + index * 62;
  return (
    <Animated.View
      style={{
        position: "absolute",
        top: y,
        width: 220 + (index % 3) * 50,
        height: 28 + (index % 2) * 12,
        opacity: 0.22,
        transform: [{ translateX: x }, { rotate: `${-12 + index * 2.5}deg` }],
      }}
    >
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.45)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1, borderRadius: 20 }}
      />
    </Animated.View>
  );
}

export function wavePath(width: number, height: number, amp: number, phase = 0) {
  const y = height * 0.48;
  const step = 160;
  let d = `M ${-step} ${y}`;
  for (let x = -step; x <= width + step; x += step) {
    const lift = x / step + phase;
    const a = amp * (lift % 2 === 0 ? 1 : -1);
    d += ` C ${x + 40} ${y - a}, ${x + 80} ${y + a}, ${x + step} ${y}`;
  }
  d += ` L ${width + step} ${height} L ${-step} ${height} Z`;
  return d;
}

export function AnimatedWave({
  color,
  height = 120,
  amp = 22,
  duration = 7000,
  phase = 0,
  shift,
  rotate = "0deg",
  top,
  bottom,
  left = -80,
  width = 900,
}: {
  color: string;
  height?: number;
  amp?: number;
  duration?: number;
  phase?: number;
  shift?: Animated.AnimatedInterpolation<number> | Animated.Value;
  rotate?: string;
  top?: number;
  bottom?: number;
  left?: number;
  width?: number;
}) {
  const drift = useLoop(duration, duration);
  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -160] });
  const transform = shift
    ? [{ rotate }, { translateX: tx }, { translateY: shift }]
    : [{ rotate }, { translateX: tx }];
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        width,
        height,
        transform,
      }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path d={wavePath(width, height, amp, phase)} fill={color} />
      </Svg>
    </Animated.View>
  );
}

export function Sparkles({ count = 8 }: { count?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <Sparkle key={i} index={i} />
      ))}
    </View>
  );
}

function Sparkle({ index }: { index: number }) {
  const t = useOscillate(2600 + index * 380, index);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.85] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.25] });
  const left = 18 + ((index * 47) % 82);
  const top = 12 + ((index * 29) % 78);
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#F7E7B0",
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export function GlowDot({
  size = 16,
  color = "rgba(244,228,176,0.95)",
  active = false,
}: {
  size?: number;
  color?: string;
  active?: boolean;
}) {
  const t = useOscillate(active ? 1300 : 2800);
  const opacity = t.interpolate({
    inputRange: [0, 1],
    outputRange: active ? [0.45, 1] : [0.18, 0.42],
  });
  const scale = t.interpolate({
    inputRange: [0, 1],
    outputRange: active ? [0.82, 1.28] : [0.92, 1.08],
  });
  const halo = size * 2.2;
  return (
    <View style={{ width: halo, height: halo, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: color,
          opacity: 0.22,
          transform: [{ scale }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
    </View>
  );
}

export function WaterSheen() {
  const t = useLoop(14000);
  const x = t.interpolate({ inputRange: [0, 1], outputRange: [-220, 360] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transform: [{ translateX: x }, { rotate: "-18deg" }] }]}
    >
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.14)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: 140, height: "160%", marginTop: "-20%" }}
      />
    </Animated.View>
  );
}
