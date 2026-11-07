import { StyleSheet, Text, View } from "react-native";
import { Card, SessionShell } from "../src/components/ui";
import { FEELINGS_WHEEL } from "../src/data";
import { colors, fonts } from "../src/theme";

export default function Feelings() {
  return (
    <SessionShell title="FEELINGS" subtitle="A word for what is here">
      <Text style={styles.copy}>
        Names can make a feeling easier to notice. This is a vocabulary, not a diagnosis. Use whatever words fit, including more than one.
      </Text>
      {FEELINGS_WHEEL.map((section) => (
        <Card key={section.group} color={colors.lavenderSoft} style={styles.card}>
          <Text style={styles.group}>{section.group}</Text>
          <View style={styles.chips}>
            {section.feelings.map((feeling) => (
              <View key={feeling} style={styles.chip}>
                <Text style={styles.chipText}>{feeling}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
      <Text style={styles.hint}>If a feeling is intense, you can add a number—for example, “Worried 70%.”</Text>
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  card: { marginBottom: 10 },
  group: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 16, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(251,249,245,0.78)",
  },
  chipText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13 },
  hint: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
});
