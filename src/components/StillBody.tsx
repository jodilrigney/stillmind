import { StyleSheet, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { GlowDot } from "../motion";

const FILL = "rgba(255,248,238,0.94)";
const FILL_SOFT = "rgba(236,226,210,0.88)";
const DOT = 40;

const POINTS = [
  { id: "lc", x: 92, y: 88, color: "rgba(232,168,112,0.95)" },
  { id: "rc", x: 128, y: 88, color: "rgba(232,168,112,0.95)" },
  { id: "lb", x: 52, y: 142, color: "rgba(232,168,112,0.95)" },
  { id: "rb", x: 168, y: 142, color: "rgba(232,168,112,0.95)" },
];

export function StillBody({ activeId }: { activeId?: string }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="220" height="280" viewBox="0 0 220 280">
        <Path d="M64 98 C 46 114 38 142 42 176 C 44 190 56 192 60 178 C 64 150 70 122 84 104 Z" fill={FILL_SOFT} />
        <Path d="M156 98 C 174 114 182 142 178 176 C 176 190 164 192 160 178 C 156 150 150 122 136 104 Z" fill={FILL_SOFT} />
        <Path
          d="M76 80 C 68 88 66 100 74 112 L 82 210 C 96 224 124 224 138 210 L 146 112 C 154 100 152 88 144 80 C 130 70 90 70 76 80 Z"
          fill={FILL}
        />
        <Path d="M100 58 L104 78 L116 78 L120 58" fill={FILL} />
        <Ellipse cx="110" cy="36" rx="22" ry="24" fill={FILL} />
      </Svg>
      {POINTS.map((p) => (
        <View key={p.id} style={[styles.dot, { left: p.x - DOT / 2, top: p.y - DOT / 2 }]}>
          <GlowDot active={activeId === p.id} size={activeId === p.id ? 14 : 9} color={p.color} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 220,
    height: 280,
    alignSelf: "center",
  },
  dot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    alignItems: "center",
    justifyContent: "center",
  },
});
