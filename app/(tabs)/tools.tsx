import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playFrequencyPad } from "../../src/audio";
import { speakMeditationClip } from "../../src/speak";
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
  { href: "/(tabs)", title: "Daily gratitude", subtitle: "Notice and keep the small good things", color: colors.peachSoft },
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
        <Text style={styles.intro}>Worksheets and guides for understanding patterns and caring for daily wellbeing.</Text>
        <PrivacyBadge />
        <Text style={styles.kicker}>Therapeutic worksheets</Text>
        {THERAPY.map((i) => (
          <Pressable key={i.href} onPress={() => router.push(i.href as never)}>
            <Card color={i.color} style={{ marginBottom: 10 }}>
              <Text style={styles.item}>{i.title}</Text>
            </Card>
          </Pressable>
        ))}
        <Text style={styles.kicker}>Guides</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/brain-health")}>
          <Card color={colors.sageSoft} style={{ marginBottom: 10 }}>
            <Text style={styles.item}>Brain Health guide</Text>
            <Text style={styles.smallCopy}>Food, nutrients, herbs, evidence, and safety cautions</Text>
          </Card>
        </Pressable>
        <Text style={styles.kicker}>Everyday support</Text>
        <View style={styles.grid}>
          {EVERYDAY.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => {
                if (item.href === "/meditate/sleep") {
                  playFrequencyPad("calming-zen", 0.46).catch(() => {});
                  speakMeditationClip("sleep-0", 0.184).catch(() => {});
                }
                router.push(item.href as never);
              }}
              style={styles.gridItem}
            >
              <Card color={item.color} style={styles.smallCard}>
                <Text style={styles.smallTitle}>{item.title}</Text>
                <Text style={styles.smallCopy}>{item.subtitle}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
        <Text style={styles.foot}>Providers and immediate support are available in the Health tab.</Text>
      </ScrollView>
    </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.titleLight, letterSpacing: 8, color: colors.muted },
  h1: { fontFamily: fonts.titleBold, fontSize: 26, color: colors.ink, marginTop: 8, marginBottom: 4 },
  intro: { fontFamily: fonts.body, color: colors.ink, lineHeight: 22, fontSize: 15, marginBottom: 10 },
  kicker: { fontFamily: fonts.titleBold, marginTop: 16, marginBottom: 8, color: colors.ink },
  item: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "48%" },
  smallCard: { minHeight: 124, padding: 14 },
  smallTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 15 },
  smallCopy: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  foot: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 16 },
});
