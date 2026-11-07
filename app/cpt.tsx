import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { store } from "../src/storage";
import { colors, fonts } from "../src/theme";

const THEMES = ["Safety", "Trust", "Power / control", "Esteem", "Intimacy"] as const;

const PATTERNS = [
  "Jumping to conclusions",
  "Exaggerating or minimizing",
  "Ignoring important information",
  "Oversimplifying",
  "Overgeneralizing",
  "Emotional reasoning",
] as const;

const PATTERN_EXPLANATIONS = [
  { name: "Jumping to conclusions", meaning: "Deciding what something means without enough evidence." },
  { name: "Exaggerating or minimizing", meaning: "Making one part seem much larger or smaller than the full picture supports." },
  { name: "Ignoring important information", meaning: "Leaving out facts that do not fit the stuck point." },
  { name: "Oversimplifying", meaning: "Reducing a complex situation to one cause or one explanation." },
  { name: "Overgeneralizing", meaning: "Using one experience to make a broad rule about yourself, others, or the future." },
  { name: "Emotional reasoning", meaning: "Treating a strong feeling as proof that the belief is factual." },
] as const;

const FEELINGS_WHEEL = [
  { group: "Joy", feelings: ["Happy", "Hopeful", "Proud", "Grateful", "Playful", "Peaceful"] },
  { group: "Sadness", feelings: ["Sad", "Lonely", "Hurt", "Disappointed", "Grief", "Tired"] },
  { group: "Fear", feelings: ["Anxious", "Worried", "Overwhelmed", "Insecure", "Helpless", "Nervous"] },
  { group: "Anger", feelings: ["Angry", "Frustrated", "Irritated", "Resentful", "Jealous", "Betrayed"] },
  { group: "Surprise", feelings: ["Surprised", "Confused", "Amazed", "Startled", "Curious", "Uncertain"] },
  { group: "Disgust", feelings: ["Uncomfortable", "Disapproving", "Avoidant", "Repelled", "Judgmental", "Ashamed"] },
] as const;

const EMPTY_FORM = {
  situation: "",
  belief: "",
  emotion: "",
  beliefBefore: "",
  evidenceFor: "",
  evidenceAgainst: "",
  habitOrFact: "",
  missingInfo: "",
  languageCheck: "",
  feelingOrFact: "",
  responsibility: "",
  patterns: "",
  challenge: "",
  beliefAfter: "",
  emotionAfter: "",
};

export default function Cpt() {
  const { stuck, saveStuck } = useApp();
  const [theme, setTheme] = useState<string>("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feelingsOpen, setFeelingsOpen] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const [patternsHelpOpen, setPatternsHelpOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const togglePattern = (pattern: string) => {
    setForm((current) => {
      const selected = current.patterns.split(",").map((item) => item.trim()).filter(Boolean);
      const next = selected.includes(pattern)
        ? selected.filter((item) => item !== pattern)
        : [...selected, pattern];
      return { ...current, patterns: next.join(", ") };
    });
  };

  return (
    <SessionShell title="CPT" subtitle="Stuck Point Reflection">
      <Text style={styles.copy}>
        CPT is a structured treatment for PTSD that is best used with a trained clinician. This private reflection follows its stuck-point questions; you do not need to describe trauma details.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: helpOpen }}
        onPress={() => setHelpOpen((open) => !open)}
        style={styles.helpButton}
      >
        <Text style={styles.helpButtonText}>{helpOpen ? "Hide stuck-point guide" : "What is a stuck point?"}</Text>
        <Text style={styles.helpMark}>{helpOpen ? "−" : "+"}</Text>
      </Pressable>
      {helpOpen ? (
        <View style={styles.helpCard}>
          <Text style={styles.helpStrong}>A stuck point is a concise belief that may keep recovery stuck.</Text>
          <Text style={styles.helpText}>It may use “if–then,” “always,” “never,” “everyone,” “should,” or “must.”</Text>
          <Text style={styles.helpExample}>Examples: “If I trust someone, I will be hurt.” “I should have known.” “I must always be on guard.”</Text>
          <Text style={styles.helpText}>A feeling, behavior, question, or fact is not itself a stuck point. Ask what belief sits underneath it.</Text>
        </View>
      ) : null}

      <Text style={styles.section}>1 · Notice</Text>
      <Text style={styles.label}>Theme (optional)</Text>
      <Text style={styles.example}>Which area does this belief touch?</Text>
      <View style={styles.chips}>
        {THEMES.map((item) => {
          const selected = theme === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setTheme(selected ? "" : item)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <Field
        label="Situation or trigger"
        example="Keep it brief; no trauma details are needed. Example: Someone cancelled our plans."
        value={form.situation}
        onChangeText={(value) => setField("situation", value)}
      />
      <Field
        label="Stuck point"
        example="A belief, not a feeling or fact. Example: If I let people close, I will be hurt."
        value={form.belief}
        onChangeText={(value) => setField("belief", value)}
      />
      <Field
        label="Emotions and intensity"
        example="Example: Fear 80%, sadness 50%."
        value={form.emotion}
        onChangeText={(value) => setField("emotion", value)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: feelingsOpen }}
        onPress={() => setFeelingsOpen((open) => !open)}
        style={styles.feelingsLink}
      >
        <Text style={styles.feelingsLinkText}>{feelingsOpen ? "Hide feelings wheel" : "Need a word? Open feelings wheel"}</Text>
      </Pressable>
      {feelingsOpen ? (
        <View style={styles.feelingsWheel}>
          {FEELINGS_WHEEL.map((section) => (
            <View key={section.group} style={styles.feelingSection}>
              <Text style={styles.feelingGroup}>{section.group}</Text>
              <View style={styles.feelingChips}>
                {section.feelings.map((feeling) => (
                  <Pressable
                    key={feeling}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${feeling}`}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        emotion: current.emotion.trim()
                          ? `${current.emotion.trim()}, ${feeling}`
                          : feeling,
                      }))
                    }
                    style={styles.feelingChip}
                  >
                    <Text style={styles.feelingChipText}>{feeling}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <Text style={styles.feelingsHint}>Tap any words that fit, then add an intensity if helpful—for example, “Fear 80%.”</Text>
        </View>
      ) : null}
      <ScaleQuestion
        label="How true does it feel right now?"
        value={form.beliefBefore}
        onChange={(value) => setField("beliefBefore", value)}
      />

      <Text style={styles.section}>2 · Examine the belief</Text>
      <Field
        label="Factual evidence supporting it"
        example="What observable facts support this belief? Avoid guesses or feelings."
        value={form.evidenceFor}
        onChangeText={(value) => setField("evidenceFor", value)}
      />
      <Field
        label="Factual evidence against it"
        example="What facts show it may not be completely true?"
        value={form.evidenceAgainst}
        onChangeText={(value) => setField("evidenceAgainst", value)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: checksOpen }}
        onPress={() => setChecksOpen((open) => !open)}
        style={styles.checksButton}
      >
        <View style={styles.checksButtonCopy}>
          <Text style={styles.checksButtonTitle}>Quick belief checks (optional)</Text>
          <Text style={styles.checksButtonHint}>A few tap choices—no writing needed</Text>
        </View>
        <Text style={styles.helpMark}>{checksOpen ? "−" : "+"}</Text>
      </Pressable>
      {checksOpen ? (
        <View style={styles.checksCard}>
          <ChoiceQuestion
            label="Is this a familiar belief rather than a dependable fact?"
            value={form.habitOrFact}
            onChange={(value) => setField("habitOrFact", value)}
          />
          <ChoiceQuestion
            label="Could important context or another explanation be missing?"
            value={form.missingInfo}
            onChange={(value) => setField("missingInfo", value)}
          />
          <ChoiceQuestion
            label="Does it use extremes like always, never, must, or should?"
            value={form.languageCheck}
            onChange={(value) => setField("languageCheck", value)}
          />
          <ChoiceQuestion
            label="Could a strong feeling be making the belief seem factual?"
            value={form.feelingOrFact}
            onChange={(value) => setField("feelingOrFact", value)}
          />
          <ChoiceQuestion
            label="Could other people or circumstances share some responsibility?"
            value={form.responsibility}
            onChange={(value) => setField("responsibility", value)}
          />
        </View>
      ) : null}

      <Text style={styles.label}>Patterns that may fit (optional)</Text>
      <View style={styles.chips}>
        {PATTERNS.map((pattern) => {
          const selected = form.patterns.split(",").map((item) => item.trim()).includes(pattern);
          return (
            <Pressable
              key={pattern}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => togglePattern(pattern)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{selected ? `${pattern} ✓` : pattern}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: patternsHelpOpen }}
        onPress={() => setPatternsHelpOpen((open) => !open)}
        style={styles.patternsHelpButton}
      >
        <Text style={styles.patternsHelpButtonText}>
          {patternsHelpOpen ? "Hide pattern explanations" : "What do these patterns mean?"}
        </Text>
        <Text style={styles.helpMark}>{patternsHelpOpen ? "−" : "+"}</Text>
      </Pressable>
      {patternsHelpOpen ? (
        <View style={styles.patternsHelpCard}>
          {PATTERN_EXPLANATIONS.map((pattern) => (
            <View key={pattern.name} style={styles.patternExplanation}>
              <Text style={styles.patternName}>{pattern.name}</Text>
              <Text style={styles.patternMeaning}>{pattern.meaning}</Text>
            </View>
          ))}
          <Text style={styles.patternsNote}>These are thinking habits, not labels. Choose one only if it helps you look at the whole picture.</Text>
        </View>
      ) : null}

      <Text style={styles.section}>3 · Reframe</Text>
      <Field
        label="A more balanced belief"
        example="Use the whole picture. Example: Some people may hurt me, but I can build trust gradually and notice who is safe."
        value={form.challenge}
        onChangeText={(value) => setField("challenge", value)}
      />
      <ScaleQuestion
        label="How true does the original stuck point feel now?"
        value={form.beliefAfter}
        onChange={(value) => setField("beliefAfter", value)}
      />
      <Field
        label="How do you feel now?"
        example="Re-rate the emotions. Example: Fear 45%, relief 30%."
        value={form.emotionAfter}
        onChangeText={(value) => setField("emotionAfter", value)}
      />

      <PrimaryButton
        label="Keep this on-device"
        onPress={() => {
          saveStuck([{ id: store.id(), date: store.today(), theme, ...form }, ...stuck]);
          setTheme("");
          setForm(EMPTY_FORM);
        }}
      />
      {stuck.map((s) => (
        <Card key={s.id} style={{ marginTop: 12 }} color={colors.peachSoft}>
          <Text style={styles.savedMeta}>{[s.date, s.theme].filter(Boolean).join(" · ")}</Text>
          <Text style={styles.body}>{s.belief}</Text>
          {s.challenge ? <Text style={styles.savedBalanced}>{s.challenge}</Text> : null}
          {deleteConfirmId === s.id ? (
            <View style={styles.deleteConfirm}>
              <Text style={styles.deletePrompt}>Remove this saved reflection?</Text>
              <View style={styles.deleteActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDeleteConfirmId(null)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    saveStuck(stuck.filter((item) => item.id !== s.id));
                    setDeleteConfirmId(null);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete saved reflection"
              onPress={() => setDeleteConfirmId(s.id)}
              style={styles.removeLink}
            >
              <Text style={styles.removeLinkText}>Delete saved reflection</Text>
            </Pressable>
          )}
        </Card>
      ))}
    </SessionShell>
  );
}

function Field({
  label,
  example,
  value,
  onChangeText,
  compact = false,
}: {
  label: string;
  example: string;
  value: string;
  onChangeText: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.example}>{example}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, compact && styles.inputCompact]}
        multiline={!compact}
        keyboardType={compact ? "number-pad" : "default"}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function ChoiceQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const choices = ["Yes", "No", "Not sure"];

  return (
    <View style={styles.choiceQuestion}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {choices.map((choice) => {
          const selected = value === choice;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? "" : choice)}
              style={[styles.choiceChip, selected && styles.chipOn]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ScaleQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const choices = ["0%", "25%", "50%", "75%", "100%"];

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleHint}>Not at all</Text>
        <Text style={styles.scaleHint}>Completely</Text>
      </View>
      <View style={styles.scaleRow}>
        {choices.map((choice) => {
          const selected = value === choice;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? "" : choice)}
              style={[styles.scaleChip, selected && styles.chipOn]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 10, lineHeight: 20 },
  section: { fontFamily: fonts.titleBold, color: colors.sageDeep, fontSize: 18, marginTop: 12, marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { fontFamily: fonts.bodyMed, color: colors.ink, marginBottom: 3 },
  example: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 6 },
  input: { backgroundColor: colors.paper, borderRadius: 14, padding: 10, minHeight: 70, fontFamily: fonts.body, color: colors.ink },
  inputCompact: { minHeight: 46 },
  body: { fontFamily: fonts.bodyBold, color: colors.ink },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: colors.peachSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  helpButtonText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 14 },
  helpMark: { fontFamily: fonts.titleBold, color: colors.sageDeep, fontSize: 20 },
  helpCard: { backgroundColor: "rgba(244,224,212,0.64)", borderRadius: 16, padding: 14, gap: 7, marginBottom: 8 },
  helpStrong: { fontFamily: fonts.bodyBold, color: colors.ink, lineHeight: 20 },
  helpText: { fontFamily: fonts.body, color: colors.muted, lineHeight: 19 },
  helpExample: { fontFamily: fonts.bodyMed, color: colors.sageDeep, lineHeight: 19 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  chip: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: "rgba(251,249,245,0.72)",
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.28)",
  },
  chipOn: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  chipText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12 },
  chipTextOn: { color: colors.sageDeep },
  checksButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: "rgba(220,228,211,0.52)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  checksButtonCopy: { flex: 1, paddingRight: 10 },
  checksButtonTitle: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 14 },
  checksButtonHint: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, marginTop: 2 },
  checksCard: {
    backgroundColor: "rgba(251,249,245,0.72)",
    borderRadius: 16,
    padding: 13,
    gap: 14,
    marginBottom: 14,
  },
  choiceQuestion: { gap: 7 },
  choiceLabel: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, lineHeight: 18 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choiceChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.24)",
  },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 2, marginBottom: 5 },
  scaleHint: { fontFamily: fonts.body, color: colors.muted, fontSize: 11 },
  scaleRow: { flexDirection: "row", gap: 6 },
  scaleChip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(251,249,245,0.72)",
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.24)",
  },
  patternsHelpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: -6,
    marginBottom: 12,
    backgroundColor: "rgba(224,219,239,0.42)",
  },
  patternsHelpButtonText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  patternsHelpCard: {
    backgroundColor: "rgba(251,249,245,0.72)",
    borderRadius: 16,
    padding: 13,
    gap: 11,
    marginBottom: 14,
  },
  patternExplanation: { gap: 2 },
  patternName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 },
  patternMeaning: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17 },
  patternsNote: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 12, lineHeight: 17, marginTop: 2 },
  feelingsLink: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 2, marginTop: -8, marginBottom: 8 },
  feelingsLinkText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  feelingsWheel: {
    backgroundColor: "rgba(251,249,245,0.72)",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  feelingSection: { gap: 5 },
  feelingGroup: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 13 },
  feelingChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  feelingChip: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  feelingChipText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12 },
  feelingsHint: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17 },
  savedMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, marginBottom: 5 },
  savedBalanced: { fontFamily: fonts.body, color: colors.sageDeep, lineHeight: 19, marginTop: 7 },
  removeLink: { alignSelf: "flex-start", paddingVertical: 7, marginTop: 7 },
  removeLinkText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 12, textDecorationLine: "underline" },
  deleteConfirm: { marginTop: 12, gap: 9 },
  deletePrompt: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  deleteActions: { flexDirection: "row", gap: 8 },
  cancelButton: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.62)",
  },
  cancelButtonText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12 },
  deleteButton: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "rgba(181,112,100,0.18)",
  },
  deleteButtonText: { fontFamily: fonts.bodyBold, color: "#8A5148", fontSize: 12 },
});
