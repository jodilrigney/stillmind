import { StyleSheet, Text } from "react-native";
import { Card, SessionShell } from "../src/components/ui";
import { DISTORTIONS } from "../src/data";
import { colors, fonts } from "../src/theme";

export default function Distortions() {
  return (
    <SessionShell title="CBT" subtitle="Cognitive Distortion Guide">
      <Text style={styles.copy}>These are common thinking habits, not character flaws. Notice, then loosen.</Text>
      {DISTORTIONS.map((d) => (
        <Card key={d.id} color={colors.lavenderSoft} style={{ marginBottom: 12 }}>
          <Text style={styles.title}>{d.title}</Text>
          <Text style={styles.body}>{d.body}</Text>
          <Text style={styles.reframe}>{d.reframe}</Text>
        </Card>
      ))}
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 12 },
  title: { fontFamily: fonts.titleBold, fontSize: 18, color: colors.ink },
  body: { fontFamily: fonts.body, color: colors.muted, marginVertical: 6 },
  reframe: { fontFamily: fonts.bodyMed, color: colors.sageDeep },
});
