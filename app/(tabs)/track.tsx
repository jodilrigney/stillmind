import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Pill, PrimaryButton, PrivacyBadge } from "../../src/components/ui";
import { useApp } from "../../src/context/AppProvider";
import { COMMON_MEDS, EMOTION_TAGS, SYMPTOMS } from "../../src/data";
import { imgSource, images } from "../../src/images";
import { CheckIn, store } from "../../src/storage";
import { colors, fonts } from "../../src/theme";

export default function TrackTab() {
  const insets = useSafeAreaInsets();
  const { checkins, saveCheckIn, meds, saveMeds, medLog, saveMedLog, journal, saveJournal, gratitude, saveGratitude } = useApp();
  const today = store.today();
  const existing = checkins.find((c) => c.date === today);
  const [mood, setMood] = useState(existing?.mood ?? 7);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [symptoms, setSymptoms] = useState<Record<string, number>>(existing?.symptoms ?? {});
  const [sleep, setSleep] = useState(existing?.sleepHours ?? 7.5);
  const [quality, setQuality] = useState(existing?.sleepQuality ?? 3);
  const [hard, setHard] = useState(existing?.hardToSleep ?? false);
  const [wakes, setWakes] = useState(existing?.nightWakes ?? false);
  const [note, setNote] = useState(journal.find((j) => j.date === today)?.text ?? "");
  const [reframe, setReframe] = useState(journal.find((j) => j.date === today)?.reframe ?? "");
  const [showMeds, setShowMeds] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDose, setCustomDose] = useState("");
  const [thanks, setThanks] = useState(gratitude.find((g) => g.date === today)?.text ?? "");

  const moodLabel = mood >= 8 ? "Good" : mood >= 5 ? "Okay" : "Heavy";

  const save = async () => {
    const row: CheckIn = {
      id: existing?.id || store.id(),
      date: today,
      mood,
      tags,
      symptoms,
      sleepHours: sleep,
      sleepQuality: quality,
      nightWakes: wakes,
      hardToSleep: hard,
    };
    await saveCheckIn(row);
    const others = journal.filter((j) => j.date !== today);
    await saveJournal([{ id: store.id(), date: today, text: note, reframe }, ...others]);
    if (thanks.trim()) {
      const otherThanks = gratitude.filter((g) => g.date !== today);
      await saveGratitude([{ id: store.id(), date: today, text: thanks.trim() }, ...otherThanks]);
    }
  };

  const avg = useMemo(() => {
    if (!checkins.length) return "—";
    const a = checkins.slice(0, 7).reduce((s, c) => s + c.mood, 0) / Math.min(7, checkins.length);
    return a.toFixed(1);
  }, [checkins]);

  return (
    <ImageBackground source={imgSource(images.forest)} style={{ flex: 1 }}>
    <LinearGradient colors={["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 18, paddingBottom: 48 }}>
        <PrivacyBadge />
        <Text style={styles.h1}>StillMind check-in</Text>
        <Text style={styles.sub}>7-day mood average: {avg}</Text>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>How are you feeling right now?</Text>
          <Text style={styles.mood}>
            {mood} — {moodLabel}
          </Text>
          <View style={styles.sliderRow}>
            <Pressable onPress={() => setMood(Math.max(1, mood - 1))} style={styles.nudge}>
              <Text>-</Text>
            </Pressable>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${mood * 10}%` }]} />
            </View>
            <Pressable onPress={() => setMood(Math.min(10, mood + 1))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
          <View style={styles.tags}>
            {EMOTION_TAGS.map((t) => (
              <Pill
                key={t}
                label={t}
                selected={tags.includes(t)}
                color={colors.lavenderSoft}
                onPress={() =>
                  setTags((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]))
                }
              />
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>Symptom Tracker</Text>
          {SYMPTOMS.map((s) => (
            <View key={s.id} style={styles.sym}>
              <Text style={styles.symLabel}>{s.label}</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[0, 1, 2, 3].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setSymptoms((x) => ({ ...x, [s.id]: n }))}
                    style={[styles.dot, (symptoms[s.id] || 0) >= n && n > 0 && styles.dotOn, symptoms[s.id] === 0 && n === 0 && styles.dotOn]}
                  />
                ))}
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>Medication & Sleep</Text>
          <Text style={styles.sleep}>{sleep.toFixed(1)} hrs</Text>
          <View style={styles.sliderRow}>
            <Pressable onPress={() => setSleep(Math.max(0, sleep - 0.5))} style={styles.nudge}>
              <Text>-</Text>
            </Pressable>
            <Pressable onPress={() => setSleep(Math.min(14, sleep + 0.5))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
          <RowSwitch label="Difficulty falling asleep" value={hard} onValueChange={setHard} />
          <RowSwitch label="Waking during the night" value={wakes} onValueChange={setWakes} />
          <Text style={[styles.kicker, { marginTop: 10 }]}>Daily meds & supplements</Text>
          {meds.map((m) => {
            const taken = medLog.some((l) => l.date === today && l.medId === m.id && l.taken);
            return (
              <Pressable
                key={m.id}
                style={styles.med}
                onPress={() => {
                  const next = taken
                    ? medLog.filter((l) => !(l.date === today && l.medId === m.id))
                    : [...medLog, { id: store.id(), date: today, medId: m.id, taken: true, time: new Date().toISOString() }];
                  saveMedLog(next);
                }}
              >
                <Text style={styles.symLabel}>{taken ? "☑" : "☐"} {m.name}{m.dose ? ` · ${m.dose}` : ""}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.soft}>Add your own</Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Name (medication or supplement)"
            placeholderTextColor={colors.muted}
            style={styles.medInput}
          />
          <TextInput
            value={customDose}
            onChangeText={setCustomDose}
            placeholder="Dose (optional)"
            placeholderTextColor={colors.muted}
            style={styles.medInput}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!customName.trim()) return;
              saveMeds([...meds, { id: store.id(), name: customName.trim(), dose: customDose.trim() }]);
              setCustomName("");
              setCustomDose("");
            }}
          >
            <Text style={styles.link}>Add custom item</Text>
          </Pressable>
          <Pressable onPress={() => setShowMeds((v) => !v)}>
            <Text style={styles.link}>{showMeds ? "Hide common list" : "Add from common prescriptions"}</Text>
          </Pressable>
          {showMeds
            ? COMMON_MEDS.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    saveMeds([...meds, { id: store.id(), name, dose: "" }]);
                    setShowMeds(false);
                  }}
                >
                  <Text style={styles.option}>{name}</Text>
                </Pressable>
              ))
            : null}
        </Card>

        <Card style={{ marginTop: 12 }} color={colors.peachSoft}>
          <Text style={styles.kicker}>One thing I noticed with thanks</Text>
          <Text style={styles.soft}>A small, true detail is enough. It does not have to be a big feeling.</Text>
          <TextInput
            value={thanks}
            onChangeText={setThanks}
            style={styles.input}
            multiline
            placeholder="The light on the wall, a warm drink, someone who checked in..."
            placeholderTextColor={colors.muted}
          />
          {gratitude.filter((g) => g.date !== today).slice(0, 4).map((g) => (
            <Text key={g.id} style={styles.history}>
              {g.date}: {g.text}
            </Text>
          ))}
        </Card>

        <Card style={{ marginTop: 12 }} color="rgba(211,228,235,0.78)">
          <Text style={styles.kicker}>A small place for today</Text>
          <Text style={styles.soft}>
            If something wants to be written, you can leave it here. There is no right way, and you do not
            have to make it make sense.
          </Text>
          <TextInput value={note} onChangeText={setNote} style={styles.input} multiline placeholder="What moved through you today..." placeholderTextColor={colors.muted} />
          <Text style={styles.soft}>If a softer sentence arrives, it can rest underneath.</Text>
          <TextInput value={reframe} onChangeText={setReframe} style={styles.input} multiline placeholder="Optional. Only if it feels kind." placeholderTextColor={colors.muted} />
        </Card>

        <PrimaryButton label="Save today's check-in" onPress={save} />
        <Pressable onPress={() => router.push("/report")} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={styles.link}>Generate healthcare summary</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
    </ImageBackground>
  );
}

function RowSwitch({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.sym}>
      <Text style={styles.symLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.sage }} />
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.titleBold, fontSize: 26, color: colors.ink, marginTop: 10 },
  sub: { fontFamily: fonts.body, color: colors.muted, marginBottom: 4 },
  kicker: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 16, marginBottom: 8 },
  mood: { fontFamily: fonts.titleLight, fontSize: 28, color: colors.ink },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  bar: { flex: 1, height: 10, backgroundColor: colors.creamDeep, borderRadius: 5, overflow: "hidden" },
  fill: { height: 10, backgroundColor: colors.lavender },
  nudge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  sym: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  symLabel: { fontFamily: fonts.body, color: colors.ink },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.creamDeep },
  dotOn: { backgroundColor: colors.sage },
  sleep: { fontFamily: fonts.titleBold, fontSize: 28, color: colors.ink },
  med: { paddingVertical: 6 },
  link: { fontFamily: fonts.bodyMed, color: colors.sageDeep },
  option: { fontFamily: fonts.body, color: colors.ink, paddingVertical: 6 },
  soft: { fontFamily: fonts.body, color: colors.muted, marginBottom: 8 },
  input: {
    minHeight: 70,
    backgroundColor: colors.linen,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  history: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  medInput: {
    backgroundColor: colors.linen,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    fontFamily: fonts.body,
    color: colors.ink,
  },
});
