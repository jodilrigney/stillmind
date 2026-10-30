import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { store } from "../src/storage";
import { colors, fonts } from "../src/theme";

const FIELDS = [
  ["situation", "Situation"],
  ["thought", "Automatic thoughts"],
  ["emotion", "Emotions felt"],
  ["evidenceFor", "Evidence supporting the thought"],
  ["evidenceAgainst", "Evidence against the thought"],
  ["balanced", "A more balanced perspective"],
] as const;

export default function ThoughtRecord() {
  const { thoughts, saveThoughts } = useApp();
  const [form, setForm] = useState({
    situation: "",
    thought: "",
    emotion: "",
    evidenceFor: "",
    evidenceAgainst: "",
    balanced: "",
  });

  return (
    <SessionShell title="CBT" subtitle="Thought Record">
      <Text style={styles.copy}>Record the moment without arguing with yourself yet. Then look for both sides.</Text>
      {FIELDS.map(([key, label]) => (
        <View key={key} style={{ marginBottom: 10 }}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={form[key]}
            onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
            style={styles.input}
            multiline
          />
        </View>
      ))}
      <PrimaryButton
        label="Save on this device"
        onPress={() => {
          saveThoughts([{ id: store.id(), date: store.today(), ...form }, ...thoughts]);
          setForm({ situation: "", thought: "", emotion: "", evidenceFor: "", evidenceAgainst: "", balanced: "" });
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
  input: { backgroundColor: colors.paper, borderRadius: 14, padding: 10, minHeight: 64, fontFamily: fonts.body, color: colors.ink },
  body: { fontFamily: fonts.body, color: colors.ink },
});
