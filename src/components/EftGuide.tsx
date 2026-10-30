import { StyleSheet, Text, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { GlowDot } from "../motion";
import { colors, fonts } from "../theme";

export type EftKind = "hand" | "face" | "torso" | "crown";

const FILL = "rgba(255,248,238,0.94)";
const FILL_SOFT = "rgba(236,226,210,0.88)";
const GLOW = "rgba(232,168,112,0.95)";
const DOT = 40;

export function EftGuide({
  kind,
  label,
  hint,
  finger,
}: {
  kind: EftKind;
  label: string;
  hint: string;
  finger: string;
}) {
  return (
    <View>
      <View style={styles.stage}>
        {kind === "hand" ? <HandTap /> : null}
        {kind === "face" ? <FaceTap point={label} /> : null}
        {kind === "torso" ? <TorsoTap point={label} /> : null}
        {kind === "crown" ? <CrownTap /> : null}
      </View>
      <Text style={styles.finger}>{finger}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

function Dots({
  points,
  activeId,
}: {
  points: { id: string; x: number; y: number }[];
  activeId: string;
}) {
  return (
    <>
      {points.map((p) => (
        <View key={p.id} style={[styles.dot, { left: p.x - DOT / 2, top: p.y - DOT / 2 }]}>
          <GlowDot active={p.id === activeId} size={p.id === activeId ? 14 : 8} color={GLOW} />
        </View>
      ))}
    </>
  );
}

function HandTap() {
  return (
    <View style={{ width: 240, height: 230 }}>
      <Svg width="240" height="230" viewBox="0 0 240 230">
        <Path
          d="M118 222
             C 104 222 98 208 100 192
             L 102 156
             C 74 150 48 136 44 112
             C 40 88 58 76 76 86
             C 90 94 98 112 104 132
             C 96 104 86 62 90 34
             C 92 14 112 10 118 30
             C 122 50 122 96 120 128
             C 122 90 120 46 128 20
             C 134 2 154 6 156 28
             C 158 50 152 94 148 128
             C 154 96 158 58 168 36
             C 176 18 194 22 192 46
             C 190 68 180 102 174 130
             C 182 108 196 88 208 84
             C 222 78 228 96 220 112
             C 212 126 198 140 186 150
             C 202 158 214 174 212 192
             C 210 212 176 226 138 224
             C 126 224 120 224 118 222 Z"
          fill={FILL}
        />
      </Svg>
      <Dots points={[{ id: "karate", x: 196, y: 168 }]} activeId="karate" />
    </View>
  );
}

function FaceTap({ point }: { point: string }) {
  const points = [
    { id: "Eyebrow", x: 140, y: 80 },
    { id: "Side of eye", x: 174, y: 106 },
    { id: "Under eye", x: 152, y: 128 },
    { id: "Under nose", x: 130, y: 152 },
    { id: "Chin", x: 130, y: 176 },
  ];
  return (
    <View style={{ width: 240, height: 220 }}>
      <Svg width="240" height="220" viewBox="0 0 240 220">
        <Ellipse cx="130" cy="118" rx="52" ry="66" fill={FILL} />
        <Ellipse cx="112" cy="106" rx="7" ry="3.5" fill={FILL_SOFT} />
        <Ellipse cx="148" cy="106" rx="7" ry="3.5" fill={FILL_SOFT} />
      </Svg>
      <Dots points={points} activeId={point} />
    </View>
  );
}

function TorsoTap({ point }: { point: string }) {
  const collar = point.includes("Collarbone");
  return (
    <View style={{ width: 220, height: 240 }}>
      <Svg width="220" height="240" viewBox="0 0 220 240">
        <Path d="M64 96 C 48 112 40 138 44 168 C 46 180 58 182 62 168 C 66 142 72 116 84 100 Z" fill={FILL_SOFT} />
        <Path d="M156 96 C 172 112 180 138 176 168 C 174 180 162 182 158 168 C 154 142 148 116 136 100 Z" fill={FILL_SOFT} />
        <Path
          d="M76 78 C 68 86 66 98 74 110 L 82 200 C 96 214 124 214 138 200 L 146 110 C 154 98 152 86 144 78 C 130 68 90 68 76 78 Z"
          fill={FILL}
        />
        <Path d="M100 56 L104 76 L116 76 L120 56" fill={FILL} />
        <Ellipse cx="110" cy="34" rx="20" ry="22" fill={FILL} />
      </Svg>
      <Dots
        points={[
          { id: "Collarbone", x: 110, y: 86 },
          { id: "Under arm", x: 168, y: 138 },
        ]}
        activeId={collar ? "Collarbone" : "Under arm"}
      />
    </View>
  );
}

function CrownTap() {
  return (
    <View style={{ width: 220, height: 200 }}>
      <Svg width="220" height="200" viewBox="0 0 220 200">
        <Ellipse cx="110" cy="118" rx="50" ry="62" fill={FILL} />
        <Ellipse cx="94" cy="114" rx="7" ry="3.5" fill={FILL_SOFT} />
        <Ellipse cx="126" cy="114" rx="7" ry="3.5" fill={FILL_SOFT} />
      </Svg>
      <Dots points={[{ id: "crown", x: 110, y: 56 }]} activeId="crown" />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", minHeight: 200 },
  dot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    alignItems: "center",
    justifyContent: "center",
  },
  finger: {
    textAlign: "center",
    fontFamily: fonts.bodyMed,
    color: colors.ink,
    marginTop: 4,
  },
  hint: { textAlign: "center", fontFamily: fonts.body, color: colors.muted, marginTop: 4 },
});
