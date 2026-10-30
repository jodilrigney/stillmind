import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, PrivacyBadge } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { imgSource, images } from "../src/images";
import { colors, fonts } from "../src/theme";

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { ready, welcomed, session, setWelcomed, signIn } = useApp();
  const [email, setEmail] = useState("");
  const [showGoogle, setShowGoogle] = useState(false);

  useEffect(() => {
    if (ready && welcomed && session) router.replace("/(tabs)");
  }, [ready, welcomed, session]);

  if (!ready) return null;

  const enter = async (provider: "google-local" | "device") => {
    await signIn({
      signedIn: true,
      provider,
      name: provider === "google-local" ? email.split("@")[0] || "You" : "You",
      email: provider === "google-local" ? email.trim() : "",
    });
    await setWelcomed();
    router.replace("/(tabs)");
  };

  return (
    <ImageBackground source={imgSource(images.lake)} style={{ flex: 1 }}>
      <LinearGradient
        colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]}
        style={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={{ alignItems: "center" }}>
          <PrivacyBadge />
          <View style={{ height: 16 }} />
          <BrandMark />
        </View>

        <View style={styles.card}>
          <Text style={styles.h1}>Your calm space. Whenever you need it.</Text>
          <Text style={styles.copy}>
            Everything stays private on your device. Google is only a local label so this phone can
            remember you. Nothing is uploaded. Health data never leaves StillMind.
          </Text>

          {showGoogle ? (
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <Text style={styles.hint}>Use your Google email as an on-device name only.</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@gmail.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Google on this device"
                style={styles.google}
                onPress={() => enter("google-local")}
              >
                <Ionicons name="logo-google" size={18} color={colors.ink} />
                <Text style={styles.googleText}>Continue with Google on this device</Text>
              </Pressable>
            </KeyboardAvoidingView>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              style={styles.google}
              onPress={() => setShowGoogle(true)}
            >
              <Ionicons name="logo-google" size={18} color={colors.ink} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue without an account"
            style={styles.quiet}
            onPress={() => enter("device")}
          >
            <Text style={styles.quietText}>Continue without an account</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "space-between", paddingHorizontal: 22 },
  card: {
    backgroundColor: "rgba(251,249,245,0.86)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  h1: {
    fontFamily: fonts.titleBold,
    fontSize: 26,
    color: colors.ink,
    lineHeight: 32,
    marginBottom: 10,
  },
  copy: { fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  hint: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(61,57,51,0.12)",
    borderRadius: 16,
    padding: 12,
    fontFamily: fonts.body,
    marginBottom: 12,
    backgroundColor: colors.linen,
    color: colors.ink,
  },
  google: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.linen,
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(61,57,51,0.12)",
  },
  googleText: { fontFamily: fonts.bodyMed, color: colors.ink },
  quiet: { alignItems: "center", marginTop: 14 },
  quietText: { fontFamily: fonts.bodyMed, color: colors.sageDeep },
});
