import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { DISTORTIONS } from "../src/data";
import { store } from "../src/storage";
import { colors, fonts } from "../src/theme";

const FIELDS = [
  ["situation", "Situation", "Example: A friend read my message but hasn’t replied."],
  ["emotion", "Emotions felt", "Example: Anxious 70%, sad 40%."],
  ["thought", "Automatic thoughts", "Example: They’re upset with me. I always ruin things."],
  ["pattern", "Thinking pattern (optional)", "Example: Mind reading and overgeneralization."],
  ["evidenceFor", "Factual evidence supporting the thought", "Example: Their reply is later than usual. Use observable facts—not feelings or guesses."],
  ["evidenceAgainst", "Factual evidence against the thought", "Example: They said work was busy, and they were warm with me yesterday."],
  ["balanced", "A more balanced perspective", "Example: I don’t know why they haven’t replied. There are several ordinary explanations."],
  ["emotionAfter", "How do you feel now?", "Example: Anxious 40%, calmer 30%."],
] as const;

const FEELINGS_WHEEL = [
  { group: "Joy", feelings: ["Happy", "Hopeful", "Proud", "Grateful", "Playful", "Peaceful"] },
  { group: "Sadness", feelings: ["Sad", "Lonely", "Hurt", "Disappointed", "Grief", "Tired"] },
  { group: "Fear", feelings: ["Anxious", "Worried", "Overwhelmed", "Insecure", "Helpless", "Nervous"] },
  { group: "Anger", feelings: ["Angry", "Frustrated", "Irritated", "Resentful", "Jealous", "Betrayed"] },
  { group: "Surprise", feelings: ["Surprised", "Confused", "Amazed", "Startled", "Curious", "Uncertain"] },
  { group: "Disgust", feelings: ["Uncomfortable", "Disapproving", "Avoidant", "Repelled", "Judgmental", "Ashamed"] },
] as const;

export default function ThoughtRecord() {
  const { thoughts, saveThoughts } = useApp();
  const [guideOpen, setGuideOpen] = useState(false);
  const [feelingsOpen, setFeelingsOpen] = useState(false);
  const [form, setForm] = useState({
    situation: "",
    emotion: "",
    thought: "",
    pattern: "",
    evidenceFor: "",
    evidenceAgainst: "",
    balanced: "",
    emotionAfter: "",
  });

  return (
    <SessionShell title="CBT" subtitle="Thought Record">
      <Text style={styles.copy}>Start with what happened, how you felt, and the thought that appeared. Then compare that thought with the facts.</Text>
      {FIELDS.map(([key, label, example]) => (
        <View key={key} style={{ marginBottom: 10 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.example}>{example}</Text>
          <TextInput
            value={form[key]}
            onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
            style={styles.input}
            multiline
          />
          {key === "emotion" ? (
            <>
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
                  <Text style={styles.feelingsHint}>Tap any words that fit, then add an intensity if helpful—for example, “Anxious 70%.”</Text>
                </View>
              ) : null}
            </>
          ) : null}
          {key === "pattern" ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: guideOpen }}
                onPress={() => setGuideOpen((open) => !open)}
                style={styles.guideButton}
              >
                <Text style={styles.guideButtonText}>{guideOpen ? "Hide thinking patterns" : "Open thinking patterns guide"}</Text>
                <Text style={styles.guideButtonMark}>{guideOpen ? "−" : "+"}</Text>
              </Pressable>
              {guideOpen ? (
                <View style={styles.guide}>
                  <Text style={styles.guideIntro}>Does one of these habits fit the automatic thought? This is optional—don’t force a label.</Text>
                  {DISTORTIONS.map((d) => {
                    const selected = form.pattern
                      .split(",")
                      .map((value) => value.trim())
                      .includes(d.title);
                    return (
                      <Pressable
                        key={d.id}
                        accessibilityRole="button"
                        accessibilityLabel={selected ? `Remove ${d.title}` : `Add ${d.title}`}
                        accessibilityState={{ selected }}
                        onPress={() =>
                          setForm((current) => {
                            const patterns = current.pattern
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean);
                            return {
                              ...current,
                              pattern: selected
                                ? patterns.filter((value) => value !== d.title).join(", ")
                                : [...new Set([...patterns, d.title])].join(", "),
                            };
                          })
                        }
                        style={[styles.distortion, selected && styles.distortionSelected]}
                      >
                        <Text style={styles.distortionTitle}>{d.title}</Text>
                        <Text style={styles.distortionBody}>{d.body}</Text>
                        <Text style={styles.distortionReframe}>{d.reframe}</Text>
                        <Text style={styles.distortionAdd}>{selected ? "Added ✓ · tap to remove" : "Tap to add"}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ))}
      <PrimaryButton
        label="Save on this device"
        onPress={() => {
          saveThoughts([{ id: store.id(), date: store.today(), ...form }, ...thoughts]);
          setForm({
            situation: "",
            emotion: "",
            thought: "",
            pattern: "",
            evidenceFor: "",
            evidenceAgainst: "",
            balanced: "",
            emotionAfter: "",
          });
        }}
      />
      {thoughts.slice(0, 5).map((t) => (
        <Card key={t.id} style={{ marginTop: 12 }} color={colors.waterSoft}>
          <Text style={styles.label}>{t.date}</Text>
          <Text style={styles.body}>{t.balanced || t.thought}</Text>
        </Card>
      ))}
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 12, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMed, color: colors.ink, marginBottom: 4 },
  example: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 6 },
  input: { backgroundColor: colors.paper, borderRadius: 14, padding: 10, minHeight: 64, fontFamily: fonts.body, color: colors.ink },
  body: { fontFamily: fonts.body, color: colors.ink },
  guideButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.lavenderSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  guideButtonText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 14 },
  guideButtonMark: { fontFamily: fonts.titleBold, color: colors.sageDeep, fontSize: 20 },
  guide: { marginBottom: 14, gap: 8 },
  guideIntro: { fontFamily: fonts.body, color: colors.muted, lineHeight: 19, marginBottom: 2 },
  distortion: {
    backgroundColor: "rgba(230,221,236,0.62)",
    borderRadius: 14,
    padding: 12,
  },
  distortionSelected: {
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.sage,
  },
  distortionTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 15 },
  distortionBody: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  distortionReframe: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13, lineHeight: 18, marginTop: 5 },
  distortionAdd: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 11, marginTop: 7 },
  feelingsLink: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 2 },
  feelingsLinkText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  feelingsWheel: {
    backgroundColor: "rgba(251,249,245,0.72)",
    borderRadius: 16,
    padding: 12,
    gap: 10,
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
});
