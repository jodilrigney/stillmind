import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ImageBackground, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, ScreenHeader } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { imgSource, images } from "../src/images";
import { store } from "../src/storage";
import { colors, fonts } from "../src/theme";

export default function Hold() {
  const { held, saveHeld } = useApp();
  const [text, setText] = useState("");
  const place = async () => {
    if (!text.trim()) return;
    await saveHeld([{ id: store.id(), text: text.trim(), date: store.today() }, ...held]);
    setText("");
  };

  return (
    <ImageBackground source={imgSource(images.cabin)} style={{ flex: 1 }}>
      <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
        <ScreenHeader title="LAND" subtitle="Put it somewhere safe" />
        <View style={{ padding: 18, gap: 12 }}>
          <Card>
            <Text style={styles.big}>You don't have to carry it alone.</Text>
            <Text style={styles.soft}>Name what feels heavy. StillMind will keep it on this device.</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Set it down here..."
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
            <PrimaryButton label="We'll hold it" color={colors.lavender} onPress={place} />
          </Card>
          {held.slice(0, 8).map((h) => (
            <Card key={h.id} color={colors.lavenderSoft}>
              <Text style={styles.soft}>{h.date}</Text>
              <Text style={styles.body}>{h.text}</Text>
            </Card>
          ))}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  big: { fontFamily: fonts.titleBold, fontSize: 22, color: colors.ink, marginBottom: 6 },
  soft: { fontFamily: fonts.body, color: colors.muted, marginBottom: 10 },
  body: { fontFamily: fonts.body, color: colors.ink, lineHeight: 20 },
  input: {
    minHeight: 90,
    borderRadius: 16,
    backgroundColor: colors.linen,
    padding: 12,
    fontFamily: fonts.body,
    color: colors.ink,
    marginBottom: 12,
  },
});
