import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { imgSource, photos } from "../images";
import { GlowDot } from "../motion";
import { colors, fonts } from "../theme";

const GLOW = "rgba(232,168,112,0.95)";
const DOT = 16;

const EFT_DOTS: { id: string; x: `${number}%`; y: `${number}%` }[] = [
  { id: "crown", x: "50%", y: "7.4%" },
  { id: "brow", x: "45%", y: "18.2%" },
  { id: "sideEye", x: "61.6%", y: "20.2%" },
  { id: "underEye", x: "56.2%", y: "22.8%" },
  { id: "nose", x: "50%", y: "26.4%" },
  { id: "chin", x: "50%", y: "31%" },
  { id: "collar", x: "54%", y: "46.5%" },
  { id: "underArm", x: "73%", y: "59%" },
  { id: "karate", x: "46.5%", y: "64%" },
];

export function EftGuide({
  activeId,
  hint,
  finger,
  onNext,
}: {
  activeId: string;
  hint: string;
  finger: string;
  onNext: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next tapping point"
        onPress={onNext}
        style={styles.stage}
      >
        <View style={styles.figureBox} pointerEvents="none">
          <Image source={imgSource(photos.eftFigure)} resizeMode="contain" style={styles.figure} fadeDuration={0} />
          {EFT_DOTS.filter((p) => p.id === activeId).map((p) => (
            <View key={p.id} style={[styles.dot, { left: p.x, top: p.y }]}>
              <GlowDot active size={p.id === "karate" ? 9 : 7} color={GLOW} />
            </View>
          ))}
        </View>
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.finger}>{finger}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
  },
  stage: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    cursor: "pointer",
  },
  figureBox: {
    height: "100%",
    aspectRatio: 472 / 708,
    position: "relative",
  },
  figure: {
    width: "100%",
    height: "100%",
  },
  copy: {
    marginTop: -52,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 4,
  },
  dot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    marginLeft: -DOT / 2,
    marginTop: -DOT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  finger: {
    textAlign: "center",
    fontFamily: fonts.bodyMed,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowRadius: 10,
  },
  hint: {
    textAlign: "center",
    fontFamily: fonts.body,
    color: "#2A261F",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(255,252,245,0.95)",
    textShadowRadius: 10,
  },
});
