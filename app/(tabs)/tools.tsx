import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, Card, PrivacyBadge } from "../../src/components/ui";
import { FOODS } from "../../src/data";
import { imgSource, images } from "../../src/images";
import { colors, fonts, shadow } from "../../src/theme";

const ITEMS = [
  { href: "/thought-record", title: "CBT Thought Record", color: colors.waterSoft },
  { href: "/distortions", title: "Cognitive Distortion Guide", color: colors.lavenderSoft },
  { href: "/cpt", title: "CPT stuck points", color: colors.peachSoft },
  { href: "/tist", title: "TIST grounding", color: colors.sageSoft },
  { href: "/brain-health", title: "Brain Health & nutrition", color: colors.sand },
  { href: "/help", title: "Help & safety", color: colors.paper },
];

export default function ToolsTab() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={imgSource(images.dappled)} style={{ flex: 1 }}>
    <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, paddingBottom: 40 }}>
        <BrandMark compact />
        <Text style={styles.h1}>Nurture & Exercises</Text>
        <PrivacyBadge />
        <Text style={styles.kicker}>Foods for Thought</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 8, paddingRight: 8 }}
        >
          {FOODS.slice(0, 4).map((f) => (
            <Pressable key={f.id} onPress={() => router.push("/brain-health")} style={[styles.food, shadow.card]}>
              <Image source={imgSource(images[f.imageKey])} style={styles.foodImg} />
              <Text style={styles.foodTitle}>{f.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.kicker}>Therapeutic worksheets</Text>
        {ITEMS.map((i) => (
          <Pressable key={i.href} onPress={() => router.push(i.href as never)}>
            <Card color={i.color} style={{ marginBottom: 10 }}>
              <Text style={styles.item}>{i.title}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.titleLight, letterSpacing: 8, color: colors.muted },
  h1: { fontFamily: fonts.titleBold, fontSize: 26, color: colors.ink, marginVertical: 8 },
  kicker: { fontFamily: fonts.titleBold, marginTop: 16, marginBottom: 8, color: colors.ink },
  food: { width: 150, backgroundColor: colors.paper, borderRadius: 18, overflow: "hidden" },
  foodImg: { width: 150, height: 90 },
  foodTitle: { fontFamily: fonts.bodyMed, padding: 8, color: colors.ink, fontSize: 13 },
  item: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16 },
});
