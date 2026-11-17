import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, HelpGuide, PrivacyBadge, SessionShell } from "../src/components/ui";
import { BrainHealthCategory, FOODS } from "../src/data";
import { ImageKey, imgSource, images } from "../src/images";
import { colors, fonts } from "../src/theme";

const FILTERS: Array<"All" | BrainHealthCategory> = ["All", "Food", "Nutrient", "Herb"];

export default function BrainHealth() {
  const [help, setHelp] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return FOODS.filter(
      (item) =>
        (filter === "All" || item.category === filter) &&
        (!needle ||
          `${item.title} ${item.support} ${item.sources}`.toLowerCase().includes(needle))
    );
  }, [filter, query]);

  return (
    <SessionShell
      title="BRAIN HEALTH"
      subtitle="Food, nutrients & herbs"
      onHelp={() => setHelp(true)}
      guide={
        <HelpGuide
          open={help}
          title="How to use Brain Health"
          lines={[
            "This is a private educational guide to foods, nutrients, and herbs that may support mood, sleep, and focus. It is not a treatment plan.",
            "Search or filter by Food, Nutrient, or Herb. Open a card, then tap Sources, evidence & safety for the research notes and cautions.",
            "Everyday eating patterns matter more than one “perfect” ingredient. No single food treats a mental-health condition.",
            "Supplements and herbs can interact with medicines. Check with a clinician or dietitian before starting anything new, especially in pregnancy.",
          ]}
          onClose={() => setHelp(false)}
        />
      }
    >
      <PrivacyBadge />
      <Text style={styles.copy}>
        Start with a varied food pattern. No single food treats a mental-health condition, and supplements or herbs can interact with medicines.
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search foods, nutrients, or herbs"
        placeholderTextColor={colors.muted}
        style={styles.search}
        accessibilityLabel="Search brain health guide"
      />
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.filterOn]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Card color={colors.waterSoft} style={styles.patternCard}>
        <Text style={styles.patternTitle}>The big picture matters most</Text>
        <Text style={styles.patternCopy}>
          Regular meals with vegetables, fruit, whole grains, beans, nuts, olive oil, and fish have stronger support than chasing one “perfect” ingredient.
        </Text>
      </Card>
      {items.map((f) => {
        const open = openId === f.id;
        return (
          <Card key={f.id} color={f.color} style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
            <Image source={imgSource(images[f.imageKey as ImageKey])} style={styles.img} />
            <View style={{ padding: 14 }}>
              <Text style={styles.category}>{f.category}</Text>
              <Text style={styles.title}>{f.title}</Text>
              <Text style={styles.support}>{f.support}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenId(open ? null : f.id)}
                style={styles.more}
              >
                <Text style={styles.moreText}>{open ? "Hide details" : "Sources, evidence & safety"}</Text>
                <Text style={styles.moreMark}>{open ? "−" : "+"}</Text>
              </Pressable>
              {open ? (
                <View style={styles.details}>
                  <Text style={styles.detailLabel}>Try from food</Text>
                  <Text style={styles.detailText}>{f.sources}</Text>
                  <Text style={styles.detailLabel}>What the evidence says</Text>
                  <Text style={styles.detailText}>{f.evidence}</Text>
                  {f.caution ? (
                    <View style={styles.caution}>
                      <Text style={styles.cautionTitle}>Check first</Text>
                      <Text style={styles.detailText}>{f.caution}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Card>
        );
      })}
      <Text style={styles.footer}>
        Nutrition information is educational. A clinician or registered dietitian can help with deficiencies, supplements, allergies, pregnancy, and medication interactions.
      </Text>
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginVertical: 12, lineHeight: 20 },
  search: {
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: "rgba(251,249,245,0.82)",
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    marginBottom: 10,
  },
  filters: { flexDirection: "row", gap: 7, marginBottom: 12 },
  filter: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 8,
    backgroundColor: "rgba(251,249,245,0.68)",
  },
  filterOn: { backgroundColor: colors.sageSoft },
  filterText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 12 },
  filterTextOn: { color: colors.sageDeep },
  patternCard: { marginBottom: 14 },
  patternTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 17 },
  patternCopy: { fontFamily: fonts.body, color: colors.muted, lineHeight: 19, marginTop: 5 },
  img: { width: "100%", height: 130 },
  category: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase" },
  title: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, marginBottom: 6 },
  support: { fontFamily: fonts.body, color: colors.ink, lineHeight: 19 },
  more: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(61,57,51,0.09)",
  },
  moreText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 12 },
  moreMark: { fontFamily: fonts.titleBold, color: colors.sageDeep, fontSize: 18 },
  details: { gap: 4, marginTop: 9 },
  detailLabel: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 12, marginTop: 5 },
  detailText: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17 },
  caution: { backgroundColor: "rgba(244,224,212,0.62)", borderRadius: 12, padding: 10, marginTop: 5 },
  cautionTitle: { fontFamily: fonts.bodyBold, color: "#8A5148", fontSize: 12, marginBottom: 2 },
  footer: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16, marginHorizontal: 4, marginBottom: 8 },
});
