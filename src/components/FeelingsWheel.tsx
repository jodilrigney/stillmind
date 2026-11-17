import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FEELINGS_WHEEL } from "../data";
import { colors, fonts } from "../theme";

function sameWord(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function labelFor(tag: string) {
  for (const section of FEELINGS_WHEEL) {
    const hit = section.feelings.find((feeling) => sameWord(feeling, tag));
    if (hit) return hit;
  }
  return tag;
}

export function FeelingsWheel({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (feeling: string) => {
    const has = selected.some((tag) => sameWord(tag, feeling));
    onChange(has ? selected.filter((tag) => !sameWord(tag, feeling)) : [...selected, feeling]);
  };

  return (
    <View style={styles.wrap}>
      {!open && selected.length ? (
        <View style={styles.picked}>
          {selected.map((tag) => {
            const label = labelFor(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label}`}
                onPress={() => toggle(label)}
                style={[styles.feelingChip, styles.feelingChipOn]}
              >
                <Text style={styles.feelingChipText}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.feelingsLink}
      >
        <Text style={styles.feelingsLinkText}>{open ? "Hide feelings" : "Need a word? Open feelings"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.feelingsWheel}>
          {FEELINGS_WHEEL.map((section) => (
            <View key={section.group} style={styles.feelingSection}>
              <Text style={styles.feelingGroup}>{section.group}</Text>
              <View style={styles.feelingChips}>
                {section.feelings.map((feeling) => {
                  const on = selected.some((tag) => sameWord(tag, feeling));
                  return (
                    <Pressable
                      key={feeling}
                      accessibilityRole="button"
                      accessibilityLabel={on ? `Remove ${feeling}` : `Add ${feeling}`}
                      accessibilityState={{ selected: on }}
                      onPress={() => toggle(feeling)}
                      style={[styles.feelingChip, on && styles.feelingChipOn]}
                    >
                      <Text style={styles.feelingChipText}>{feeling}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Text style={styles.feelingsHint}>Tap any words that fit. You can choose more than one.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  picked: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
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
  feelingChipOn: {
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.sage,
  },
  feelingChipText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12 },
  feelingsHint: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17 },
});
