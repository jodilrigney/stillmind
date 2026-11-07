import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { colors, fonts } from "../src/theme";

type Mode = "practice" | "learn";

const RESPONSES = [
  { name: "Fight", short: "Pushes back", detail: "May feel angry, critical, tense, or ready to defend." },
  { name: "Flight", short: "Moves away", detail: "May feel restless, worried, busy, or driven to escape." },
  { name: "Freeze", short: "Goes still", detail: "May feel numb, foggy, distant, or unable to move." },
  { name: "Submit", short: "Gives in", detail: "May feel small, ashamed, powerless, or quick to agree." },
  { name: "Attach", short: "Seeks closeness", detail: "May urgently seek reassurance, approval, or connection." },
] as const;

const FEELINGS = ["Scared", "Angry", "Numb", "Restless", "Ashamed", "Sad", "Overwhelmed", "Not sure"];
const NEEDS = ["More space", "Reassurance", "A boundary", "Rest", "Connection", "Choice", "Not sure"];
const ACTIONS = [
  "Feel my feet",
  "Look around slowly",
  "Take a longer exhale",
  "Sip some water",
  "Soften my shoulders",
  "Reach out to someone safe",
];

export default function Tist() {
  const [mode, setMode] = useState<Mode>("practice");

  return (
    <SessionShell title="TIST" subtitle="Present-focused parts practice">
      <Text style={styles.copy}>
        Notice a protective response, stay connected to the present, and choose what may help—without revisiting the story.
      </Text>
      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === "practice" }}
          onPress={() => setMode("practice")}
          style={[styles.tab, mode === "practice" && styles.tabOn]}
        >
          <Text style={[styles.tabText, mode === "practice" && styles.tabTextOn]}>Gentle practice</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === "learn" }}
          onPress={() => setMode("learn")}
          style={[styles.tab, mode === "learn" && styles.tabOn]}
        >
          <Text style={[styles.tabText, mode === "learn" && styles.tabTextOn]}>Understand TIST</Text>
        </Pressable>
      </View>

      {mode === "practice" ? <TistPractice /> : <TistGuide />}

      <Card color="rgba(251,249,245,0.72)" style={styles.supportCard}>
        <Text style={styles.supportText}>
          Pause whenever you want. If this feels like too much, return to your surroundings or choose additional support.
        </Text>
        <View style={styles.supportActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push("/ground")} style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Open grounding</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/health")} style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Help & safety</Text>
          </Pressable>
        </View>
      </Card>
    </SessionShell>
  );
}

function TistPractice() {
  const [step, setStep] = useState(0);
  const [orientation, setOrientation] = useState("");
  const [response, setResponse] = useState("");
  const [feeling, setFeeling] = useState("");
  const [need, setNeed] = useState("");
  const [action, setAction] = useState("");

  const reset = () => {
    setStep(0);
    setOrientation("");
    setResponse("");
    setFeeling("");
    setNeed("");
    setAction("");
  };

  if (step === 5) {
    return (
      <Card color={colors.sageSoft} style={styles.practiceCard}>
        <Text style={styles.stepKicker}>Practice complete</Text>
        <Text style={styles.finishTitle}>You noticed without having to solve everything.</Text>
        <Text style={styles.summary}>
          {response ? `A ${response.toLowerCase()} response` : "A protective response"}
          {feeling ? ` may be feeling ${feeling.toLowerCase()}` : " showed up"}.
          {need ? ` It may be asking for ${need.toLowerCase()}.` : ""}
          {action ? ` For now, you chose: ${action.toLowerCase()}.` : ""}
        </Text>
        <Text style={styles.finishNote}>Notice whether anything shifted—even 1% counts. No shift is useful information too.</Text>
        <PrimaryButton label="Begin again" onPress={reset} />
      </Card>
    );
  }

  const screens = [
    {
      title: "Arrive in the present",
      prompt: "Choose one simple way to remind your nervous system that you are here, now.",
      content: (
        <ChoiceGrid
          options={["Name today’s date", "Notice 3 neutral objects", "Feel the chair or floor", "Listen for a nearby sound"]}
          value={orientation}
          onChange={setOrientation}
        />
      ),
    },
    {
      title: "Notice the protector",
      prompt: "Which response feels closest right now? These are protective states, not personality labels.",
      content: (
        <View style={styles.responseGrid}>
          {RESPONSES.map((item) => (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              accessibilityState={{ selected: response === item.name }}
              onPress={() => setResponse(response === item.name ? "" : item.name)}
              style={[styles.responseChoice, response === item.name && styles.choiceOn]}
            >
              <Text style={[styles.choiceText, response === item.name && styles.choiceTextOn]}>{item.name}</Text>
              <Text style={styles.responseShort}>{item.short}</Text>
            </Pressable>
          ))}
          <ChoiceGrid options={["Not sure"]} value={response} onChange={setResponse} />
        </View>
      ),
    },
    {
      title: "Create a little space",
      prompt: "Try: “A part of me feels…” This lets you care about the feeling without becoming the whole feeling.",
      content: (
        <>
          <ChoiceGrid options={FEELINGS} value={feeling} onChange={setFeeling} />
          <View style={styles.phraseCard}>
            <Text style={styles.phrase}>
              A part of me feels {feeling ? feeling.toLowerCase() : "this"}, and I am here noticing it.
            </Text>
          </View>
        </>
      ),
    },
    {
      title: "Listen with curiosity",
      prompt: "What might this part be trying to protect or ask for? A best guess is enough.",
      content: <ChoiceGrid options={NEEDS} value={need} onChange={setNeed} />,
    },
    {
      title: "Choose one small response",
      prompt: "What could make this moment a little steadier? Choose only what feels comfortable.",
      content: <ChoiceGrid options={ACTIONS} value={action} onChange={setAction} />,
    },
  ];

  const screen = screens[step];
  return (
    <Card color="rgba(251,249,245,0.82)" style={styles.practiceCard}>
      <View style={styles.progressRow}>
        {screens.map((_, index) => (
          <View key={index} style={[styles.progressDot, index === step && styles.progressDotOn, index < step && styles.progressDotDone]} />
        ))}
      </View>
      <Text style={styles.stepKicker}>Step {step + 1} of {screens.length}</Text>
      <Text style={styles.practiceTitle}>{screen.title}</Text>
      <Text style={styles.practicePrompt}>{screen.prompt}</Text>
      {screen.content}
      <View style={styles.navRow}>
        {step > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setStep((current) => current - 1)} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <PrimaryButton label={step === 4 ? "Finish gently" : "Continue"} onPress={() => setStep((current) => current + 1)} />
        </View>
      </View>
      <Text style={styles.skipNote}>Every choice is optional. You can continue without selecting one.</Text>
    </Card>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? "" : option)}
            style={[styles.choice, selected && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TistGuide() {
  const [openResponse, setOpenResponse] = useState<string | null>(null);

  return (
    <View style={styles.guide}>
      <Card color={colors.sageSoft}>
        <Text style={styles.title}>What TIST means</Text>
        <Text style={styles.body}>
          Trauma-Informed Stabilization Treatment, developed by Dr. Janina Fisher, is a present-focused approach that views intense reactions as protective adaptations. It builds safety, regulation, and compassion before any optional trauma processing.
        </Text>
      </Card>
      <Card color={colors.waterSoft}>
        <Text style={styles.title}>What “parts” means here</Text>
        <Text style={styles.body}>
          “Part” is a gentle way to name a state—such as “a worried part of me”—rather than defining your whole self by one feeling. You do not need to picture separate people or accept the language if it does not fit.
        </Text>
      </Card>
      <Card color={colors.lavenderSoft}>
        <Text style={styles.title}>Common protective responses</Text>
        <Text style={styles.body}>Tap each response for a brief explanation.</Text>
        <View style={styles.responseList}>
          {RESPONSES.map((item) => {
            const open = openResponse === item.name;
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenResponse(open ? null : item.name)}
                style={styles.responseRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.responseName}>{item.name} · {item.short}</Text>
                  {open ? <Text style={styles.responseDetail}>{item.detail}</Text> : null}
                </View>
                <Text style={styles.expandMark}>{open ? "−" : "+"}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card color={colors.peachSoft}>
        <Text style={styles.title}>The helpful shift</Text>
        <Text style={styles.body}>
          Instead of “I am broken,” try “a part of me is working very hard to protect me.” Notice it with curiosity, appreciate its intention, and offer one safe choice in the present.
        </Text>
      </Card>
      <Text style={styles.clinicalNote}>
        This is a brief educational practice, not the full TIST treatment. Deeper parts work is best supported by a trauma-trained clinician.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 12, lineHeight: 20 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 9,
    backgroundColor: "rgba(251,249,245,0.62)",
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.22)",
  },
  tabOn: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  tabText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 13 },
  tabTextOn: { color: colors.sageDeep },
  practiceCard: { marginBottom: 12 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  progressDot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(61,57,51,0.1)" },
  progressDotOn: { backgroundColor: colors.sageDeep },
  progressDotDone: { backgroundColor: colors.sage },
  stepKicker: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" },
  practiceTitle: { fontFamily: fonts.titleBold, fontSize: 22, color: colors.ink, marginTop: 4 },
  practicePrompt: { fontFamily: fonts.body, color: colors.muted, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.25)",
  },
  choiceOn: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  choiceText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  choiceTextOn: { color: colors.sageDeep },
  responseGrid: { gap: 8 },
  responseChoice: {
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.25)",
  },
  responseShort: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, marginTop: 1 },
  phraseCard: { backgroundColor: colors.lavenderSoft, borderRadius: 16, padding: 14, marginTop: 14 },
  phrase: { fontFamily: fonts.title, color: colors.ink, fontSize: 17, lineHeight: 24, textAlign: "center" },
  navRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 18 },
  backButton: { borderRadius: 999, paddingVertical: 13, paddingHorizontal: 18, backgroundColor: colors.creamDeep },
  backButtonText: { fontFamily: fonts.bodyBold, color: colors.ink },
  skipNote: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 9 },
  finishTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 22, lineHeight: 29, marginTop: 6 },
  summary: { fontFamily: fonts.bodyMed, color: colors.ink, lineHeight: 21, marginTop: 12 },
  finishNote: { fontFamily: fonts.body, color: colors.muted, lineHeight: 19, marginTop: 8, marginBottom: 16 },
  guide: { gap: 10, marginBottom: 12 },
  title: { fontFamily: fonts.titleBold, fontSize: 18, color: colors.ink },
  body: { fontFamily: fonts.body, color: colors.muted, marginTop: 6, lineHeight: 20 },
  responseList: { gap: 7, marginTop: 12 },
  responseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 13,
    padding: 10,
    backgroundColor: "rgba(251,249,245,0.55)",
  },
  responseName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 },
  responseDetail: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  expandMark: { fontFamily: fonts.titleBold, color: colors.sageDeep, fontSize: 18, marginLeft: 8 },
  clinicalNote: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 6 },
  supportCard: { marginTop: 2 },
  supportText: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18 },
  supportActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  supportButton: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: colors.waterSoft },
  supportButtonText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12 },
});
