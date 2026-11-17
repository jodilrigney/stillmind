import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, PrivacyBadge } from "../../src/components/ui";
import { playFrequencyPad } from "../../src/audio";
import { MEDITATIONS } from "../../src/data";
import { ImageKey, imgSource, images } from "../../src/images";
import { colors, fonts, shadow } from "../../src/theme";

export default function MeditateTab() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={imgSource(images.mist)} style={{ flex: 1 }}>
    <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, paddingBottom: 120 }}>
        <BrandMark compact />
        <Text style={styles.h1}>Guided nature meditations</Text>
        <Text style={styles.copy}>Choose a short session. Music and a calm voice can play together.</Text>
        <PrivacyBadge />
        {MEDITATIONS.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={m.title}
            onPress={() => {
              playFrequencyPad(m.musicId, 0.48).catch(() => {});
              router.push(`/meditate/${m.id}` as never);
            }}
            style={[styles.card, shadow.card]}
          >
            <Image source={imgSource(images[m.imageKey as ImageKey])} style={styles.coverPhoto} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(20,18,14,0.04)", "rgba(20,18,14,0.28)", "rgba(20,18,14,0.82)"]}
              locations={[0, 0.48, 1]}
              style={styles.coverInner}
            >
              <Text style={styles.min}>{m.minutes} min · {m.theme}</Text>
              <Text style={styles.title}>{m.title}</Text>
            </LinearGradient>
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
  copy: { fontFamily: fonts.body, color: colors.ink, marginTop: 4, marginBottom: 12, lineHeight: 22, fontSize: 15 },
  card: { borderRadius: 22, overflow: "hidden", marginBottom: 14, height: 176 },
  coverPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverInner: { flex: 1, justifyContent: "flex-end", padding: 16 },
  min: {
    color: "#FBF9F5",
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    textShadowColor: "rgba(20,18,14,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: fonts.titleBold,
    fontSize: 24,
    textShadowColor: "rgba(20,18,14,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
