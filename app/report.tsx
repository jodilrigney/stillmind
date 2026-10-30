import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { SYMPTOMS } from "../src/data";
import { DoctorNote, store } from "../src/storage";
import { colors, fonts } from "../src/theme";

export default function Report() {
  const { checkins, meds, medLog, journal, doctor, saveDoctor } = useApp();
  const last = doctor[0];
  const [questions, setQuestions] = useState(last?.questions ?? "");
  const [updates, setUpdates] = useState(last?.updates ?? "");
  const [concerns, setConcerns] = useState(last?.concerns ?? "");

  const summary = useMemo(() => {
    const week = checkins.slice(0, 7);
    const moodAvg = week.length ? (week.reduce((s, c) => s + c.mood, 0) / week.length).toFixed(1) : "n/a";
    const sleepAvg = week.length
      ? (week.reduce((s, c) => s + c.sleepHours, 0) / week.length).toFixed(1)
      : "n/a";
    const tags = Array.from(new Set(week.flatMap((c) => c.tags))).join(", ") || "none logged";
    const symptomBits = SYMPTOMS.map((s) => {
      const vals = week.map((c) => c.symptoms[s.id] || 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return `${s.label}: ${avg.toFixed(1)}/3`;
    }).join("\n");
    const medLines = meds
      .map((m) => {
        const taken = medLog.filter((l) => l.medId === m.id && l.taken).length;
        return `${m.name} ${m.dose} · logged ${taken} times`;
      })
      .join("\n");
    return [
      "StillMind weekly summary (generated on-device)",
      `Mood average (up to 7 days): ${moodAvg}`,
      `Sleep average: ${sleepAvg} hrs`,
      `Emotion tags: ${tags}`,
      "Symptoms:",
      symptomBits,
      "Medications:",
      medLines || "none",
      "Journal (latest):",
      journal[0]?.text || "none",
      journal[0]?.reframe ? `Reframe: ${journal[0].reframe}` : "",
      "Notes for clinician:",
      `Questions: ${questions}`,
      `Updates: ${updates}`,
      `Concerns: ${concerns}`,
      "",
      "Privacy: this file was built locally. Share only with someone you choose.",
    ].join("\n");
  }, [checkins, meds, medLog, journal, questions, updates, concerns]);

  const share = async () => {
    const note: DoctorNote = { id: store.id(), date: store.today(), questions, updates, concerns };
    await saveDoctor([note, ...doctor]);
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
      }
      return;
    }
    const FileSystem = await import("expo-file-system");
    const path = `${FileSystem.cacheDirectory}still-summary.txt`;
    await FileSystem.writeAsStringAsync(path, summary);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Share StillMind summary" });
    }
  };

  return (
    <SessionShell title="SHARE" subtitle="Doctor notes & weekly report">
      <Text style={styles.copy}>
        Export a text summary you can paste into a message, email, or Google Doc. StillMind does not upload it.
      </Text>
      <Text style={styles.label}>Questions for your doctor</Text>
      <TextInput value={questions} onChangeText={setQuestions} style={styles.input} multiline />
      <Text style={styles.label}>Symptom / medication updates</Text>
      <TextInput value={updates} onChangeText={setUpdates} style={styles.input} multiline />
      <Text style={styles.label}>Concerns or progress</Text>
      <TextInput value={concerns} onChangeText={setConcerns} style={styles.input} multiline />
      <Card color={colors.sageSoft} style={{ marginVertical: 12 }}>
        <Text style={styles.pre}>{summary}</Text>
      </Card>
      <PrimaryButton label={Platform.OS === "web" ? "Copy summary" : "Share / export"} onPress={share} />
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 12, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMed, color: colors.ink, marginBottom: 4 },
  input: { backgroundColor: colors.paper, borderRadius: 14, padding: 10, minHeight: 64, marginBottom: 10, fontFamily: fonts.body, color: colors.ink },
  pre: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, lineHeight: 20 },
});
