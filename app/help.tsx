import { Linking, StyleSheet, Text } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { colors, fonts } from "../src/theme";

export default function Help() {
  return (
    <SessionShell title="HELP" subtitle="Safety notice">
      <Card color={colors.peachSoft}>
        <Text style={styles.title}>Not a fix. A space.</Text>
        <Text style={styles.body}>
          StillMind is a supportive mental health tool. It does not replace professional medical advice,
          diagnosis, or treatment. If you are in severe distress, please reach a qualified clinician or
          emergency services.
        </Text>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Text style={styles.title}>Help lines (US)</Text>
        <Text style={styles.body}>988 Suicide & Crisis Lifeline — call or text 988</Text>
        <Text style={styles.body}>Emergency — 911</Text>
        <PrimaryButton label="Call 988" color={colors.sageDeep} onPress={() => Linking.openURL("tel:988")} />
      </Card>
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, marginBottom: 8 },
  body: { fontFamily: fonts.body, color: colors.muted, lineHeight: 22, marginBottom: 8 },
});
