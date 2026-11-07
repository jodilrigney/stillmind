import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, Card, PrivacyBadge } from "../../src/components/ui";
import { imgSource, images } from "../../src/images";
import { colors, fonts } from "../../src/theme";

const THERAPY = [
  { href: "/thought-record", title: "CBT Thought Record", color: colors.waterSoft },
  { href: "/cpt", title: "CPT stuck points", color: colors.peachSoft },
  { href: "/tist", title: "TIST grounding", color: colors.sageSoft },
];

const EVERYDAY = [
  { href: "/ground", title: "Grounding & body anchor", subtitle: "Senses, pressure, and present-moment support", color: colors.sageSoft },
  { href: "/feelings", title: "Feelings wheel", subtitle: "Find words for emotions and intensity", color: colors.lavenderSoft },
  { href: "/(tabs)/track?section=gratitude", title: "Daily gratitude", subtitle: "Notice and keep the small good things", color: colors.peachSoft },
  { href: "/meditate/sleep", title: "Sleep support", subtitle: "A gentle guided wind-down", color: colors.waterSoft },
];

export default function ToolsTab() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={imgSource(images.dappled)} style={{ flex: 1 }}>
    <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, paddingBottom: 40 }}>
        <BrandMark compact />
        <Text style={styles.h1}>StillMind Resources</Text>
        <PrivacyBadge />
        <Text style={styles.intro}>Private tools for understanding patterns, settling the body, and supporting daily wellbeing.</Text>
        <Text style={styles.kicker}>Therapeutic worksheets</Text>
        {THERAPY.map((i) => (
          <Pressable key={i.href} onPress={() => router.push(i.href as never)}>
            <Card color={i.color} style={{ marginBottom: 10 }}>
              <Text style={styles.item}>{i.title}</Text>
            </Card>
          </Pressable>
        ))}
        <Text style={styles.kicker}>Everyday support</Text>
        <View style={styles.grid}>
          {EVERYDAY.map((item) => (
            <Pressable key={item.title} onPress={() => router.push(item.href as never)} style={styles.gridItem}>
              <Card color={item.color} style={styles.smallCard}>
                <Text style={styles.smallTitle}>{item.title}</Text>
                <Text style={styles.smallCopy}>{item.subtitle}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
        <Text style={styles.foot}>Brain Health, providers, and immediate support are available in the Health tab.</Text>
      </ScrollView>
    </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.titleLight, letterSpacing: 8, color: colors.muted },
  h1: { fontFamily: fonts.titleBold, fontSize: 26, color: colors.ink, marginVertical: 8 },
  intro: { fontFamily: fonts.body, color: colors.muted, lineHeight: 20, marginTop: 12 },
  kicker: { fontFamily: fonts.titleBold, marginTop: 16, marginBottom: 8, color: colors.ink },
  item: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "48%" },
  smallCard: { minHeight: 124, padding: 14 },
  smallTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 15 },
  smallCopy: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  foot: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 16 },
});
