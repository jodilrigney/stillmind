import { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { store } from "../src/storage";
import { colors, fonts } from "../src/theme";

export default function Cpt() {
  const { stuck, saveStuck } = useApp();
  const [belief, setBelief] = useState("");
  const [challenge, setChallenge] = useState("");
  const [responsibility, setResponsibility] = useState("");

  return (
    <SessionShell title="CPT" subtitle="Stuck points">
      <Text style={styles.copy}>
        Cognitive Processing Therapy helps you notice beliefs that keep you stuck — especially around
        blame, safety, and meaning — and test them with care.
      </Text>
      <Text style={styles.label}>A stuck point</Text>
      <TextInput value={belief} onChangeText={setBelief} style={styles.input} multiline placeholder="If I had done X, this wouldn't have happened..." placeholderTextColor={colors.muted} />
      <Text style={styles.label}>A challenge</Text>
      <TextInput value={challenge} onChangeText={setChallenge} style={styles.input} multiline placeholder="What else might also be true?" placeholderTextColor={colors.muted} />
      <Text style={styles.label}>Responsibility & blame</Text>
      <TextInput value={responsibility} onChangeText={setResponsibility} style={styles.input} multiline placeholder="What was actually in my control?" placeholderTextColor={colors.muted} />
      <PrimaryButton
        label="Keep this on-device"
        onPress={() => {
          saveStuck([{ id: store.id(), date: store.today(), belief, challenge, responsibility }, ...stuck]);
          setBelief("");
          setChallenge("");
          setResponsibility("");
        }}
      />
      {stuck.map((s) => (
        <Card key={s.id} style={{ marginTop: 12 }}>
          <Text style={styles.body}>{s.belief}</Text>
          <Text style={styles.copy}>{s.challenge}</Text>
        </Card>
      ))}
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 10, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMed, color: colors.ink, marginBottom: 4 },
  input: { backgroundColor: colors.paper, borderRadius: 14, padding: 10, minHeight: 70, marginBottom: 10, fontFamily: fonts.body, color: colors.ink },
  body: { fontFamily: fonts.bodyBold, color: colors.ink },
});
