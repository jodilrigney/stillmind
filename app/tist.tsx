import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { colors, fonts } from "../src/theme";

export default function Tist() {
  return (
    <SessionShell title="TIST" subtitle="Trauma-informed stabilization">
      <Text style={styles.copy}>
        Stabilization first. These tools help parts of you feel oriented to the present without forcing
        a story.
      </Text>
      <Card color={colors.sageSoft} style={{ marginBottom: 12 }}>
        <Text style={styles.title}>Safe place visualization</Text>
        <Text style={styles.body}>
          Picture a landscape that does not need anything from you. Notice color, temperature, and a
          boundary that keeps this place yours.
        </Text>
      </Card>
      <Card color={colors.waterSoft} style={{ marginBottom: 12 }}>
        <Text style={styles.title}>Nervous system regulation</Text>
        <Text style={styles.body}>Longer exhale. Heavy feet. Soft eyes. Optional bilateral tapping in Reset.</Text>
      </Card>
      <PrimaryButton label="Open Ground" onPress={() => router.push("/ground")} />
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 12, lineHeight: 20 },
  title: { fontFamily: fonts.titleBold, fontSize: 18, color: colors.ink },
  body: { fontFamily: fonts.body, color: colors.muted, marginTop: 6 },
});
