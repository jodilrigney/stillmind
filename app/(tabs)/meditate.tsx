import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, PrivacyBadge } from "../../src/components/ui";
import { MEDITATIONS } from "../../src/data";
import { imgSource, images } from "../../src/images";
import { colors, fonts, shadow } from "../../src/theme";

export default function MeditateTab() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={imgSource(images.mist)} style={{ flex: 1 }}>
    <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, paddingBottom: 120 }}>
        <BrandMark compact />
        <Text style={styles.h1}>Guided nature meditations</Text>
        <PrivacyBadge />
        <Text style={styles.copy}>Short sessions. Words stay on screen with the landscape, and a forest soundtrack if you like.</Text>
        {MEDITATIONS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => router.push(`/meditate/${m.id}` as never)}
            style={[styles.card, shadow.card]}
          >
            <ImageBackground source={imgSource(images[m.imageKey])} style={styles.cover} imageStyle={{ borderRadius: 22 }}>
              <LinearGradient colors={["transparent", "rgba(40,36,30,0.72)"]} style={styles.coverInner}>
                <Text style={styles.min}>{m.minutes} min</Text>
                <Text style={styles.title}>{m.title}</Text>
              </LinearGradient>
            </ImageBackground>
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
  copy: { fontFamily: fonts.body, color: colors.muted, marginVertical: 12, lineHeight: 20 },
  card: { borderRadius: 22, overflow: "hidden", marginBottom: 14, height: 150 },
  cover: { flex: 1 },
  coverInner: { flex: 1, justifyContent: "flex-end", padding: 14 },
  min: { color: colors.paper, fontFamily: fonts.bodyMed, fontSize: 12 },
  title: { color: colors.paper, fontFamily: fonts.titleBold, fontSize: 22 },
});
