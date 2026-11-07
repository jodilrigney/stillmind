import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Glass, PrimaryButton, ScreenHeader } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { MICRO_ACTIONS, MICRO_ACTIONS_INSIDE } from "../src/data";
import { imgSource, photos } from "../src/images";
import { useSessionAwake } from "../src/keepAwake";
import { useOscillate } from "../src/motion";
import { store } from "../src/storage";
import { colors, fonts } from "../src/theme";

type Mode = "senses" | "anchor" | "spark" | "hold";

const MODES: { id: Mode; label: string }[] = [
  { id: "senses", label: "5-4-3-2-1" },
  { id: "anchor", label: "Body anchor" },
  { id: "spark", label: "Tiny spark" },
  { id: "hold", label: "Hold" },
];

function modeFromParam(value: string | string[] | undefined): Mode {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "spark" || raw === "hold" || raw === "anchor" || raw === "senses") return raw;
  return "senses";
}

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
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(() => modeFromParam(params.mode));
  const [i, setI] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(() => Array(5).fill(false));
  const step = STEPS[i];
  const breath = useOscillate(3200);
  const footScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const subtitle =
    mode === "hold"
      ? "Put it somewhere safe"
      : mode === "spark"
        ? "One tiny move"
        : mode === "anchor"
          ? "Pressure · contact · present"
          : "Grounding · notice & settle";

  return (
    <View style={styles.screen}>
      <Image source={imgSource(photos.landWindow)} resizeMode="contain" style={styles.backdrop} />
      <View style={{ flex: 1 }}>
        <ScreenHeader title="LAND" subtitle={subtitle} />
        <View style={styles.modes}>
          {MODES.map((m) => (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={m.id === "hold" ? "Put it somewhere safe" : m.label}
              onPress={() => setMode(m.id)}
              style={[styles.mode, mode === m.id && styles.modeOn]}
            >
              <Text style={[styles.modeText, mode === m.id && styles.modeTextOn]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        {mode === "senses" ? (
          <>
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
          </>
        ) : mode === "anchor" ? (
          <BodyAnchor />
        ) : mode === "spark" ? (
          <Spark />
        ) : (
          <HoldPanel />
        )}
      </View>
    </View>
  );
}

const ANCHORS = [
  {
    title: "Press and release",
    prompt: "Press your feet gently into the floor for five seconds. Release, then notice the difference.",
    alternative: "Seated option: press your palms together, or press your hands softly into the chair.",
    icon: "footsteps-outline" as const,
  },
  {
    title: "Feel what supports you",
    prompt: "Notice the steady pressure of the chair, wall, bed, or floor holding your weight.",
    alternative: "Choose one point of contact. Nothing needs to change.",
    icon: "body-outline" as const,
  },
  {
    title: "Make one slow movement",
    prompt: "Slowly curl and uncurl your toes or fingers. Follow the movement from beginning to end.",
    alternative: "Use any comfortable movement available to you—or simply imagine the movement.",
    icon: "hand-left-outline" as const,
  },
];

function BodyAnchor() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const anchor = ANCHORS[step];

  const next = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step < ANCHORS.length - 1) {
      setStep((current) => current + 1);
    } else {
      setDone(true);
    }
  };

  return (
    <ScrollView style={styles.anchorScroll} contentContainerStyle={styles.anchorContent} showsVerticalScrollIndicator={false}>
      <Glass style={styles.anchorCard}>
        <Text style={styles.anchorEyebrow}>PROPRIOCEPTIVE GROUNDING</Text>
        {done ? (
          <>
            <View style={styles.anchorIcon}>
              <Ionicons name="checkmark" size={26} color={colors.sageDeep} />
            </View>
            <Text style={styles.anchorTitle}>You found a point of contact.</Text>
            <Text style={styles.anchorPrompt}>
              Pressure and slow movement give the brain information about where the body is right now. Even a small sense of “here” is enough.
            </Text>
            <PrimaryButton
              label="Practice again"
              onPress={() => {
                setStep(0);
                setDone(false);
              }}
            />
          </>
        ) : (
          <>
            <View style={styles.anchorHead}>
              <View style={styles.anchorIcon}>
                <Ionicons name={anchor.icon} size={25} color={colors.sageDeep} />
              </View>
              <Text style={styles.anchorStep}>Step {step + 1} of {ANCHORS.length}</Text>
            </View>
            <Text style={styles.anchorTitle}>{anchor.title}</Text>
            <Text style={styles.anchorPrompt}>{anchor.prompt}</Text>
            <Text style={styles.anchorAlternative}>{anchor.alternative}</Text>
            <View style={styles.anchorDots}>
              {ANCHORS.map((_, index) => (
                <View key={index} style={[styles.anchorDot, index === step && styles.anchorDotOn]} />
              ))}
            </View>
            <PrimaryButton label={step === ANCHORS.length - 1 ? "Finish" : "Next"} onPress={next} />
          </>
        )}
        <Text style={styles.anchorSafety}>Use gentle pressure only. Pause or choose another anchor if anything feels uncomfortable.</Text>
      </Glass>
    </ScrollView>
  );
}

type SparkPlace = "out" | "in";

function Spark() {
  const [place, setPlace] = useState<SparkPlace>("out");
  const list = place === "out" ? MICRO_ACTIONS : MICRO_ACTIONS_INSIDE;
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * MICRO_ACTIONS.length));
  const [done, setDone] = useState(0);
  const action = list[idx % list.length];
  const pickPlace = (next: SparkPlace) => {
    setPlace(next);
    const nextList = next === "out" ? MICRO_ACTIONS : MICRO_ACTIONS_INSIDE;
    setIdx(Math.floor(Math.random() * nextList.length));
  };
  const go = (did: boolean) => {
    if (did) setDone((n) => n + 1);
    setIdx((n) => (n + 3) % list.length);
  };
  return (
    <View style={styles.sparkWrap}>
      <Glass style={styles.sparkCard}>
        <View style={styles.sparkTabs}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toward outside"
            onPress={() => pickPlace("out")}
            style={[styles.sparkTab, place === "out" && styles.sparkTabOn]}
          >
            <Text style={[styles.sparkTabText, place === "out" && styles.sparkTabTextOn]}>Toward outside</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="From here"
            onPress={() => pickPlace("in")}
            style={[styles.sparkTab, place === "in" && styles.sparkTabOn]}
          >
            <Text style={[styles.sparkTabText, place === "in" && styles.sparkTabTextOn]}>From here</Text>
          </Pressable>
        </View>
        <Text style={styles.sparkLead}>
          {place === "out"
            ? "One tiny move toward open air.\nA doorway counts."
            : "Close your eyes if you like.\nPicture open air — then a tiny reach."}
        </Text>
        <View>
          <Text style={styles.sparkKicker}>Just this</Text>
          <Text style={styles.sparkAction}>{action}</Text>
        </View>
        <View>
          <View style={styles.sparkBtns}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="I did it" onPress={() => go(true)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Skip" color={colors.sand} onPress={() => go(false)} />
            </View>
          </View>
          <Text style={styles.sparkFoot}>{done} tiny completions. That's plenty.</Text>
        </View>
      </Glass>
    </View>
  );
}

function HoldPanel() {
  const { held, saveHeld } = useApp();
  const [text, setText] = useState("");
  const place = async () => {
    if (!text.trim()) return;
    await saveHeld([{ id: store.id(), text: text.trim(), date: store.today() }, ...held]);
    setText("");
  };
  return (
    <ScrollView style={styles.holdScroll} contentContainerStyle={styles.holdContent} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={styles.holdBig}>You don't have to carry it alone.</Text>
        <Text style={styles.holdSoft}>Name what feels heavy. StillMind will keep it on this device.</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Set it down here..."
          placeholderTextColor={colors.muted}
          style={styles.holdInput}
          multiline
        />
        <PrimaryButton label="We'll hold it" color={colors.lavender} onPress={place} />
      </Card>
      {held.slice(0, 8).map((h) => (
        <Card key={h.id} color={colors.lavenderSoft}>
          <Text style={styles.holdSoft}>{h.date}</Text>
          <Text style={styles.holdBody}>{h.text}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden", backgroundColor: "#5A6A5C" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  modes: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 6,
    marginBottom: 4,
  },
  mode: {
    flex: 1,
    backgroundColor: "rgba(251,249,245,0.72)",
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: "center",
  },
  modeOn: { backgroundColor: colors.sageSoft },
  modeText: { fontFamily: fonts.bodyMed, fontSize: 11, color: colors.ink },
  modeTextOn: { color: colors.sageDeep },
  ledgeSpace: { height: "48%" },
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
  anchorScroll: { flex: 1 },
  anchorContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 16 },
  anchorCard: { backgroundColor: "rgba(251,249,245,0.76)", padding: 22 },
  anchorEyebrow: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 11, letterSpacing: 1.4, marginBottom: 18 },
  anchorHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  anchorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  anchorStep: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 12 },
  anchorTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 24, lineHeight: 31, marginTop: 16 },
  anchorPrompt: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 10 },
  anchorAlternative: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(211,228,235,0.56)",
  },
  anchorDots: { flexDirection: "row", gap: 7, justifyContent: "center", marginVertical: 20 },
  anchorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(61,57,51,0.14)" },
  anchorDotOn: { width: 22, backgroundColor: colors.sage },
  anchorSafety: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 13 },
  sparkWrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
  },
  sparkTabs: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  sparkTab: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "rgba(251,249,245,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  sparkTabOn: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  sparkTabText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  sparkTabTextOn: { color: colors.sageDeep },
  sparkCard: {
    flex: 1,
    justifyContent: "space-evenly",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "rgba(251,249,245,0.64)",
  },
  sparkLead: {
    fontFamily: fonts.body,
    color: "#2A261F",
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
  },
  sparkKicker: {
    fontFamily: fonts.titleBold,
    letterSpacing: 2.4,
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  sparkAction: {
    fontFamily: fonts.titleLight,
    fontSize: 28,
    lineHeight: 38,
    color: "#2A261F",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  sparkBtns: {
    flexDirection: "row",
    gap: 12,
  },
  sparkFoot: {
    fontFamily: fonts.body,
    fontStyle: "italic",
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 18,
  },
  holdScroll: { flex: 1 },
  holdContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 12 },
  holdBig: { fontFamily: fonts.titleBold, fontSize: 22, color: colors.ink, marginBottom: 6 },
  holdSoft: { fontFamily: fonts.body, color: colors.muted, marginBottom: 10 },
  holdBody: { fontFamily: fonts.body, color: colors.ink, lineHeight: 20 },
  holdInput: {
    minHeight: 90,
    borderRadius: 16,
    backgroundColor: colors.linen,
    padding: 12,
    fontFamily: fonts.body,
    color: colors.ink,
    marginBottom: 12,
  },
});
