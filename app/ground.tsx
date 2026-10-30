import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenHeader } from "../src/components/ui";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useOscillate } from "../src/motion";
import { colors, fonts } from "../src/theme";

const STEPS = [
  {
    n: 5,
    sense: "SEE",
    prompt: "Look around you and locate five things you can see.",
    extra: "I can see the natural light...",
  },
  {
    n: 4,
    sense: "TOUCH",
    prompt: "Notice four things you can feel.",
    extra: "Cloth, air, chair, floor.",
  },
  {
    n: 3,
    sense: "HEAR",
    prompt: "Name three sounds, near or far.",
    extra: "Water, a bird, the room itself.",
  },
  {
    n: 2,
    sense: "SMELL",
    prompt: "Find two scents, or imagine a safe one.",
    extra: "Tea, rain, soap, nothing.",
  },
  {
    n: 1,
    sense: "TASTE",
    prompt: "One taste, or the quiet of your mouth.",
    extra: "You are here.",
  },
];

export default function Ground() {
  useSessionAwake();
  const [i, setI] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(() => Array(5).fill(false));
  const step = STEPS[i];
  const breath = useOscillate(3200);
  const footScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={styles.screen}>
      <Image source={imgSource(photos.landWindow)} resizeMode="contain" style={styles.backdrop} />
      <View style={{ flex: 1 }}>
        <ScreenHeader title="LAND" subtitle="Sensory visual · 5-4-3-2-1" />
        <View style={styles.ledgeSpace} />
        <View style={styles.sheet}>
          <View style={styles.card}>
            <View style={styles.headRow}>
              <Text style={styles.kicker}>
                {step.n}. {step.sense}:
              </Text>
              <View style={styles.progress}>
                {STEPS.map((_, idx) => (
                  <View key={idx} style={[styles.prog, idx === i && styles.progOn, idx < i && styles.progDone]} />
                ))}
              </View>
            </View>
            <Text style={styles.prompt}>{step.prompt}</Text>
            <View style={styles.checks}>
              {Array.from({ length: step.n }).map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() =>
                    setChecked((xs) => {
                      const next = [...xs];
                      next[idx] = !next[idx];
                      return next;
                    })
                  }
                  style={[styles.check, checked[idx] && styles.checkOn]}
                >
                  {checked[idx] ? <Ionicons name="checkmark" size={12} color={colors.linen} /> : null}
                </Pressable>
              ))}
            </View>
            <View style={styles.actionRow}>
              <TextInput
                placeholder={step.extra}
                placeholderTextColor={colors.muted}
                style={styles.input}
                numberOfLines={1}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i < STEPS.length - 1 ? "Next" : "Finish"}
                onPress={() => {
                  setChecked(Array(5).fill(false));
                  setI(i < STEPS.length - 1 ? i + 1 : 0);
                }}
                style={styles.next}
              >
                <Text style={styles.nextText}>{i < STEPS.length - 1 ? "Next" : "Finish"}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.foot}>
            <Animated.View style={[styles.footIcon, { transform: [{ scale: footScale }] }]}>
              <Ionicons name="footsteps-outline" size={22} color={colors.sageDeep} />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={styles.footTitle}>Proprioceptive Grounding</Text>
              <Text style={styles.footCopy}>Feel the weight of your feet resting flat on the ground.</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden", backgroundColor: "#5A6A5C" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  ledgeSpace: { height: "54%" },
  sheet: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  card: {
    backgroundColor: "rgba(251,249,245,0.86)",
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  kicker: { fontFamily: fonts.titleBold, color: colors.sageDeep, fontSize: 15 },
  progress: { flexDirection: "row", gap: 6 },
  prog: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(61,57,51,0.12)" },
  progOn: { backgroundColor: colors.sageDeep, transform: [{ scale: 1.3 }] },
  progDone: { backgroundColor: colors.sage },
  prompt: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  checks: { flexDirection: "row", gap: 6, marginBottom: 6 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.sage },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.linen,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  },
  next: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 13 },
  foot: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,249,245,0.8)",
    borderRadius: 18,
    padding: 8,
  },
  footIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  footTitle: { fontFamily: fonts.titleBold, color: colors.ink },
  footCopy: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
});
