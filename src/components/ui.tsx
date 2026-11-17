import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSessionAwake } from "../keepAwake";
import { APP_MARK, APP_NAME, ACRONYM_LINE, TAGLINE } from "../brand";
import React from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imgSource, images } from "../images";
import { colors, fonts, overlays, radius, shadow } from "../theme";

export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && { paddingHorizontal: 10, paddingVertical: 4 }]}>
      <Ionicons name="lock-closed" size={12} color={colors.sageDeep} />
      <Text style={styles.badgeText}>{compact ? "On-device" : "100% on-device & private"}</Text>
    </View>
  );
}

export function BrandMark({ compact = false, showAcronym = true }: { compact?: boolean; showAcronym?: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.appName}>{APP_NAME}</Text>
      <Text style={styles.mark}>{APP_MARK.split("").join("  ")}</Text>
      {compact ? null : (
        <>
          {showAcronym ? <Text style={styles.acronym}>{ACRONYM_LINE}</Text> : null}
          <Text style={styles.tag}>{TAGLINE}</Text>
        </>
      )}
    </View>
  );
}

export function NatureScreen({
  image = images.moss,
  children,
  scroll = true,
  overlay = overlays.light,
  header,
}: {
  image?: number | string;
  children: React.ReactNode;
  scroll?: boolean;
  overlay?: readonly [string, string, string];
  header?: React.ReactNode;
}) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );
  return (
    <ImageBackground source={imgSource(image)} style={{ flex: 1 }} imageStyle={{ opacity: 0.92 }}>
      <LinearGradient colors={[...overlay]} style={{ flex: 1 }}>
        {header}
        {body}
      </LinearGradient>
    </ImageBackground>
  );
}

export function Glass({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <BlurView intensity={28} tint="light" style={[styles.frost, style]}>
      {children}
    </BlurView>
  );
}

export function Card({
  children,
  style,
  color = colors.glass,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
}) {
  return (
    <View style={[styles.card, shadow.card, { backgroundColor: color }, style]}>{children}</View>
  );
}

export function Pill({
  label,
  onPress,
  selected,
  color,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.pill,
        selected && { backgroundColor: color || colors.sageSoft, borderColor: "transparent" },
      ]}
    >
      <Text style={[styles.pillText, selected && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  color = colors.sage,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.primary, { backgroundColor: color }]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8 }}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack || (() => router.back())}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.appMini}>{APP_NAME}</Text>
          <Text style={styles.kicker}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
        <PrivacyBadge compact />
      </View>
    </View>
  );
}

export function SessionShell({
  title,
  subtitle,
  children,
  image = images.moss,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  image?: number | string;
}) {
  useSessionAwake();
  return (
    <NatureScreen image={image} overlay={overlays.light} header={<ScreenHeader title={title} subtitle={subtitle} />}>
      {children}
    </NatureScreen>
  );
}

export function SettingsSheet({
  open,
  onClose,
  title = "Settings",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function Frost({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <Glass style={style}>{children}</Glass>;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "rgba(251,249,245,0.82)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(143,163,130,0.35)",
  },
  badgeText: {
    fontFamily: fonts.bodyMed,
    fontSize: 11,
    color: colors.sageDeep,
  },
  appName: {
    fontFamily: fonts.titleBold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 1,
  },
  mark: {
    fontFamily: fonts.titleLight,
    fontSize: 28,
    letterSpacing: 6,
    color: colors.ink,
    marginTop: 4,
  },
  acronym: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.sageDeep,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  tag: { fontFamily: fonts.body, color: colors.muted, marginTop: 4, fontSize: 14 },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(61,57,51,0.12)",
    backgroundColor: "rgba(251,249,245,0.7)",
  },
  pillText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 13 },
  primary: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(251,249,245,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  appMini: { fontFamily: fonts.bodyMed, fontSize: 11, color: colors.sageDeep },
  kicker: {
    fontFamily: fonts.titleBold,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.ink,
    textTransform: "uppercase",
  },
  sub: { fontFamily: fonts.body, color: colors.ink, fontSize: 14, lineHeight: 20, marginTop: 4 },
  dim: { flex: 1, backgroundColor: "rgba(61,57,51,0.28)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.linen,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.creamDeep,
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, marginBottom: 8 },
  frost: {
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
