import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, Card, PrimaryButton, PrivacyBadge } from "../../src/components/ui";
import { useApp } from "../../src/context/AppProvider";
import { imgSource, images } from "../../src/images";
import { store, SupportContact } from "../../src/storage";
import { colors, fonts } from "../../src/theme";

const EMPTY_CONTACT = {
  name: "",
  role: "",
  organization: "",
  phone: "",
  email: "",
  notes: "",
};

function call(phone: string) {
  const safe = phone.replace(/[^\d+]/g, "");
  if (safe) Linking.openURL(`tel:${safe}`);
}

function email(address: string) {
  if (address.trim()) Linking.openURL(`mailto:${address.trim()}`);
}

export default function HealthTab() {
  const insets = useSafeAreaInsets();
  const { supportContacts, saveSupportContacts, safetyPlan, saveSafetyPlan } = useApp();
  const [contactOpen, setContactOpen] = useState(false);
  const [kind, setKind] = useState<SupportContact["kind"]>("provider");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [helps, setHelps] = useState(safetyPlan.helps);
  const [place, setPlace] = useState(safetyPlan.place);
  const [planSaved, setPlanSaved] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_CONTACT);
    setKind("provider");
    setEditingId(null);
    setContactOpen(false);
  };

  const saveContact = async () => {
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) return;
    const contact: SupportContact = {
      id: editingId || store.id(),
      kind,
      name: form.name.trim(),
      role: form.role.trim(),
      organization: form.organization.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    };
    const next = editingId
      ? supportContacts.map((item) => (item.id === editingId ? contact : item))
      : [contact, ...supportContacts];
    await saveSupportContacts(next);
    resetForm();
  };

  const editContact = (contact: SupportContact) => {
    setKind(contact.kind);
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      role: contact.role,
      organization: contact.organization,
      phone: contact.phone,
      email: contact.email,
      notes: contact.notes,
    });
    setContactOpen(true);
  };

  return (
    <ImageBackground source={imgSource(images.dappled)} style={{ flex: 1 }}>
      <LinearGradient colors={["rgba(231,238,242,0.24)", "rgba(244,240,230,0.5)", "rgba(244,240,230,0.9)"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 18, paddingBottom: 42 }}
          showsVerticalScrollIndicator={false}
        >
          <BrandMark compact />
          <Text style={styles.h1}>Health & Safety</Text>
          <PrivacyBadge />
          <View style={styles.regionRow}>
            {(["Canada", "United States"] as const).map((region) => (
              <Pressable
                key={region}
                accessibilityRole="button"
                accessibilityState={{ selected: safetyPlan.region === region }}
                onPress={() => saveSafetyPlan({ ...safetyPlan, region })}
                style={[styles.regionChip, safetyPlan.region === region && styles.regionChipOn]}
              >
                <Text style={[styles.regionChipText, safetyPlan.region === region && styles.regionChipTextOn]}>{region}</Text>
              </Pressable>
            ))}
          </View>

          <Card color={colors.peachSoft} style={styles.card}>
            <Text style={styles.urgentKicker}>IMMEDIATE SUPPORT</Text>
            <Text style={styles.title}>You deserve live support.</Text>
            <Text style={styles.body}>
              In Canada and the United States, call or text 988 for suicide and crisis support. If there is immediate danger, call 911.
            </Text>
            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" onPress={() => call("988")} style={styles.primaryAction}>
                <Ionicons name="call-outline" size={17} color={colors.linen} />
                <Text style={styles.primaryActionText}>Call 988</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => Linking.openURL("sms:988")} style={styles.primaryAction}>
                <Ionicons name="chatbubble-outline" size={17} color={colors.linen} />
                <Text style={styles.primaryActionText}>Text 988</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => call("911")} style={styles.emergencyAction}>
                <Text style={styles.emergencyActionText}>Call 911</Text>
              </Pressable>
            </View>
            <Text style={styles.regionNote}>
              {safetyPlan.region}: 988 for suicide and crisis support, 911 for immediate danger. Available 24/7.
            </Text>
          </Card>

          <Text style={styles.section}>My support people</Text>
          <Text style={styles.sectionCopy}>Keep providers and a trusted safety contact together. Details stay on this device.</Text>
          {supportContacts.map((contact) => (
            <Card key={contact.id} color={contact.kind === "safety" ? colors.lavenderSoft : colors.waterSoft} style={styles.contactCard}>
              <Text style={styles.contactKind}>{contact.kind === "safety" ? "SAFETY CONTACT" : "PROVIDER"}</Text>
              <Text style={styles.contactName}>{contact.name}</Text>
              {[contact.role, contact.organization].filter(Boolean).length ? (
                <Text style={styles.contactMeta}>{[contact.role, contact.organization].filter(Boolean).join(" · ")}</Text>
              ) : null}
              {contact.notes ? <Text style={styles.contactNotes}>{contact.notes}</Text> : null}
              <View style={styles.contactActions}>
                {contact.phone ? (
                  <Pressable accessibilityRole="button" onPress={() => call(contact.phone)} style={styles.contactButton}>
                    <Ionicons name="call-outline" size={15} color={colors.sageDeep} />
                    <Text style={styles.contactButtonText}>Call</Text>
                  </Pressable>
                ) : null}
                {contact.phone ? (
                  <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`sms:${contact.phone.replace(/[^\d+]/g, "")}`)} style={styles.contactButton}>
                    <Ionicons name="chatbubble-outline" size={15} color={colors.sageDeep} />
                    <Text style={styles.contactButtonText}>Text</Text>
                  </Pressable>
                ) : null}
                {contact.email ? (
                  <Pressable accessibilityRole="button" onPress={() => email(contact.email)} style={styles.contactButton}>
                    <Ionicons name="mail-outline" size={15} color={colors.sageDeep} />
                    <Text style={styles.contactButtonText}>Email</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.manageRow}>
                <Pressable accessibilityRole="button" onPress={() => editContact(contact)}>
                  <Text style={styles.manageText}>Edit</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => saveSupportContacts(supportContacts.filter((item) => item.id !== contact.id))}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: contactOpen }}
            onPress={() => (contactOpen ? resetForm() : setContactOpen(true))}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>{contactOpen ? "Close contact form" : "+ Add provider or safety contact"}</Text>
          </Pressable>
          {contactOpen ? (
            <Card color="rgba(251,249,245,0.82)" style={styles.formCard}>
              <View style={styles.kindRow}>
                {(["provider", "safety"] as const).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: kind === item }}
                    onPress={() => setKind(item)}
                    style={[styles.kindButton, kind === item && styles.kindButtonOn]}
                  >
                    <Text style={[styles.kindText, kind === item && styles.kindTextOn]}>
                      {item === "provider" ? "Provider" : "Safety contact"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ContactInput label="Name *" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <ContactInput label="Role or specialty" value={form.role} onChangeText={(role) => setForm({ ...form, role })} />
              <ContactInput label="Organization" value={form.organization} onChangeText={(organization) => setForm({ ...form, organization })} />
              <ContactInput label="Phone" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" />
              <ContactInput label="Email" value={form.email} onChangeText={(emailValue) => setForm({ ...form, email: emailValue })} keyboardType="email-address" />
              <ContactInput label="Helpful notes" value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} multiline />
              <Text style={styles.requiredHint}>Add a name and at least a phone number or email.</Text>
              <PrimaryButton label={editingId ? "Update contact" : "Keep on this device"} onPress={saveContact} />
            </Card>
          ) : null}

          <Text style={styles.section}>My steadying plan</Text>
          <Card color={colors.sageSoft} style={styles.card}>
            <ContactInput
              label="What helps me feel a little steadier?"
              value={helps}
              onChangeText={(value) => {
                setHelps(value);
                setPlanSaved(false);
              }}
              multiline
              placeholder="Feet on the floor, fresh air, calling someone..."
            />
            <ContactInput
              label="A place I can go or stay connected"
              value={place}
              onChangeText={(value) => {
                setPlace(value);
                setPlanSaved(false);
              }}
              multiline
              placeholder="A room, a neighbour, a clinic, a public place..."
            />
            <PrimaryButton
              label={planSaved ? "Saved on this device" : "Save my plan"}
              onPress={async () => {
                await saveSafetyPlan({ ...safetyPlan, helps: helps.trim(), place: place.trim() });
                setPlanSaved(true);
              }}
            />
          </Card>

          <Pressable accessibilityRole="button" onPress={() => router.push("/brain-health")} style={styles.healthLink}>
            <View style={styles.healthIcon}>
              <Ionicons name="nutrition-outline" size={22} color={colors.sageDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.healthLinkTitle}>Brain Health guide</Text>
              <Text style={styles.healthLinkCopy}>Food, nutrients, herbs, evidence, and safety cautions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Text style={styles.disclaimer}>
            StillMind is supportive, not emergency or medical care. Hotline availability can change; if a call does not connect and danger is immediate, contact local emergency services.
          </Text>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

function ContactInput({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.inputTall]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.titleBold, fontSize: 26, color: colors.ink, marginVertical: 8 },
  card: { marginTop: 12 },
  urgentKicker: { fontFamily: fonts.bodyBold, color: "#8A5148", fontSize: 11, letterSpacing: 1.3 },
  title: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 21, marginTop: 4 },
  body: { fontFamily: fonts.body, color: colors.muted, lineHeight: 20, marginTop: 6 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: colors.sageDeep,
  },
  primaryActionText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 13 },
  emergencyAction: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 13, backgroundColor: "rgba(138,81,72,0.14)" },
  emergencyActionText: { fontFamily: fonts.bodyBold, color: "#8A5148", fontSize: 13 },
  regionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  regionChip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 8,
    backgroundColor: "rgba(251,249,245,0.72)",
  },
  regionChipOn: { backgroundColor: colors.sageSoft },
  regionChipText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 13 },
  regionChipTextOn: { color: colors.sageDeep },
  regionNote: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, marginTop: 9 },
  section: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 19, marginTop: 22 },
  sectionCopy: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3, marginBottom: 10 },
  contactCard: { marginBottom: 10 },
  contactKind: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 10, letterSpacing: 1.1 },
  contactName: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 18, marginTop: 3 },
  contactMeta: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 12, marginTop: 2 },
  contactNotes: { fontFamily: fonts.body, color: colors.ink, fontSize: 12, lineHeight: 17, marginTop: 7 },
  contactActions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: "rgba(251,249,245,0.68)",
  },
  contactButtonText: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 12 },
  manageRow: { flexDirection: "row", gap: 16, marginTop: 11 },
  manageText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 12, textDecorationLine: "underline" },
  deleteText: { fontFamily: fonts.bodyMed, color: "#8A5148", fontSize: 12, textDecorationLine: "underline" },
  addButton: { alignItems: "center", borderRadius: 999, paddingVertical: 11, backgroundColor: "rgba(251,249,245,0.76)" },
  addButtonText: { fontFamily: fonts.bodyBold, color: colors.sageDeep, fontSize: 13 },
  formCard: { marginTop: 10 },
  kindRow: { flexDirection: "row", gap: 7, marginBottom: 12 },
  kindButton: { flex: 1, alignItems: "center", borderRadius: 999, paddingVertical: 8, backgroundColor: colors.creamDeep },
  kindButtonOn: { backgroundColor: colors.sageSoft },
  kindText: { fontFamily: fonts.bodyMed, color: colors.muted, fontSize: 12 },
  kindTextOn: { color: colors.sageDeep },
  field: { marginBottom: 10 },
  fieldLabel: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 12, marginBottom: 4 },
  input: { minHeight: 43, borderRadius: 13, paddingHorizontal: 11, backgroundColor: "rgba(251,249,245,0.78)", fontFamily: fonts.body, color: colors.ink },
  inputTall: { minHeight: 70, paddingTop: 10, textAlignVertical: "top" },
  requiredHint: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, marginBottom: 9 },
  healthLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(251,249,245,0.8)",
  },
  healthIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.sageSoft },
  healthLinkTitle: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 15 },
  healthLinkCopy: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, marginTop: 2 },
  disclaimer: { fontFamily: fonts.body, color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 16 },
});
