import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeelingsWheel } from "../../src/components/FeelingsWheel";
import { Card, PrimaryButton, PrivacyBadge } from "../../src/components/ui";
import { useApp } from "../../src/context/AppProvider";
import { COMMON_MEDS, customSymptomId, symptomCatalog } from "../../src/data";
import { imgSource, images } from "../../src/images";
import { CheckIn, store } from "../../src/storage";
import { colors, fonts } from "../../src/theme";

export default function TrackTab() {
  const insets = useSafeAreaInsets();
  const { checkins, saveCheckIn, deleteCheckIn, meds, saveMeds, medLog, saveMedLog, journal, saveJournal, customSymptoms, saveCustomSymptoms } = useApp();
  const today = store.today();
  const existing = checkins.find((c) => c.date === today);
  const [mood, setMood] = useState(Math.min(5, existing?.mood ?? 3));
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [symptoms, setSymptoms] = useState<Record<string, number>>(existing?.symptoms ?? {});
  const [sleep, setSleep] = useState(existing?.sleepHours ?? 7.5);
  const [quality, setQuality] = useState(existing?.sleepQuality ?? 3);
  const [hard, setHard] = useState(existing?.hardToSleep ?? false);
  const [wakes, setWakes] = useState(existing?.nightWakes ?? false);
  const [wakeNote, setWakeNote] = useState(existing?.nightNote ?? "");
  const [note, setNote] = useState(journal.find((j) => j.date === today)?.text ?? "");
  const [reframe, setReframe] = useState(journal.find((j) => j.date === today)?.reframe ?? "");
  const [showMeds, setShowMeds] = useState(false);
  const [symptomMenu, setSymptomMenu] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDose, setCustomDose] = useState("");
  const [ownSymptom, setOwnSymptom] = useState("");

  const [savedNote, setSavedNote] = useState("");
  const moodWords = ["Heavy", "Low", "Okay", "Brighter", "Light"];
  const moodLabel = moodWords[Math.min(4, Math.max(0, mood - 1))];
  const catalog = useMemo(() => {
    const extra = [...customSymptoms];
    for (const id of Object.keys(symptoms)) {
      if (!extra.some((item) => item.id === id)) extra.push({ id, label: id.startsWith("custom:") ? id.slice(7) : id });
    }
    return symptomCatalog(extra);
  }, [customSymptoms, symptoms]);
  const chosenSymptoms = catalog.filter((s) => s.id in symptoms);
  const leftoverSymptoms = catalog.filter((s) => !(s.id in symptoms));

  const addOwnSymptom = () => {
    const label = ownSymptom.trim();
    if (!label) return;
    const match = catalog.find((item) => item.label.toLowerCase() === label.toLowerCase());
    const id = match?.id ?? customSymptomId(label);
    if (!match && id.startsWith("custom:")) {
      saveCustomSymptoms([...customSymptoms, { id, label }]).catch(() => {});
    }
    setSymptoms((x) => ({ ...x, [id]: x[id] || 1 }));
    setOwnSymptom("");
  };

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
      nightNote: wakeNote.trim(),
    };
    await saveCheckIn(row);
    const others = journal.filter((j) => j.date !== today);
    await saveJournal([{ id: store.id(), date: today, text: note, reframe }, ...others]);
    setSavedNote("Saved on this device only. StillMind does not upload check-ins.");
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
        <Text style={styles.lead}>Choose how you feel, then note sleep or anything you want to remember.</Text>
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
              <View style={[styles.fill, { width: `${(mood / 5) * 100}%` }]} />
            </View>
            <Pressable onPress={() => setMood(Math.min(5, mood + 1))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
          <FeelingsWheel selected={tags} onChange={setTags} />
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>Symptom Tracker</Text>
          <Text style={styles.soft}>Pick what is present today. You can skip anything. Your own words are saved on this device and show up next time.</Text>
          <TextInput
            value={ownSymptom}
            onChangeText={setOwnSymptom}
            placeholder="Type a word, then press enter"
            placeholderTextColor={colors.muted}
            style={styles.medInput}
            onSubmitEditing={addOwnSymptom}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          {chosenSymptoms
            .filter((s) => s.id.startsWith("custom:"))
            .concat(chosenSymptoms.filter((s) => !s.id.startsWith("custom:")))
            .map((s) => (
            <View key={s.id} style={styles.symBlock}>
              <View style={styles.symHead}>
                <Text style={styles.symLabel}>{s.label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${s.label}`}
                  onPress={() => {
                    setSymptoms((x) => {
                      const next = { ...x };
                      delete next[s.id];
                      return next;
                    });
                  }}
                  hitSlop={8}
                  style={styles.symRemove}
                >
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.dots}>
                {[1, 2, 3].map((n) => (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.label} ${n} of 3`}
                    onPress={() => setSymptoms((x) => ({ ...x, [s.id]: x[s.id] === n ? 0 : n }))}
                    style={[styles.dot, (symptoms[s.id] || 0) >= n && styles.dotOn]}
                  />
                ))}
              </View>
            </View>
          ))}
          {leftoverSymptoms.length ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={symptomMenu ? "Hide symptom list" : "Choose a symptom"}
                onPress={() => setSymptomMenu((v) => !v)}
                style={styles.drop}
              >
                <Text style={styles.dropText}>{symptomMenu ? "Hide list" : "Choose a symptom"}</Text>
                <Ionicons name={symptomMenu ? "chevron-up" : "chevron-down"} size={16} color={colors.sageDeep} />
              </Pressable>
              {symptomMenu
                ? leftoverSymptoms.map((s) => (
                    <Pressable
                      key={s.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${s.label}`}
                      onPress={() => {
                        setSymptoms((x) => ({ ...x, [s.id]: 1 }));
                        setSymptomMenu(false);
                      }}
                      style={styles.dropItem}
                    >
                      <Text style={styles.option}>{s.label}</Text>
                    </Pressable>
                  ))
                : null}
            </>
          ) : null}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>Hours of sleep</Text>
          <Text style={styles.sleep}>{sleep.toFixed(1)} hrs</Text>
          <View style={styles.sliderRow}>
            <Pressable onPress={() => setSleep(Math.max(0, +(sleep - 0.5).toFixed(1)))} style={styles.nudge}>
              <Text>-</Text>
            </Pressable>
            <Pressable onPress={() => setSleep(Math.min(14, +(sleep + 0.5).toFixed(1)))} style={styles.nudge}>
              <Text>+</Text>
            </Pressable>
          </View>
          <CircleChoice label="Difficulty falling asleep" value={hard} onPress={() => setHard((v) => !v)} />
          <CircleChoice label="Waking during the night" value={wakes} onPress={() => setWakes((v) => !v)} />
          {wakes ? (
            <TextInput
              value={wakeNote}
              onChangeText={setWakeNote}
              placeholder="Optional. What you noticed when you woke."
              placeholderTextColor={colors.muted}
              style={styles.medInput}
            />
          ) : null}
          <Text style={[styles.kicker, { marginTop: 10 }]}>Medication</Text>
          <Text style={styles.soft}>Tap a name when you take it. The date and time are saved on this device.</Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Name (medication or supplement)"
            placeholderTextColor={colors.muted}
            style={styles.medInput}
            returnKeyType="next"
          />
          <TextInput
            value={customDose}
            onChangeText={setCustomDose}
            placeholder="Dose (optional). Press enter to add."
            placeholderTextColor={colors.muted}
            style={styles.medInput}
            onSubmitEditing={() => {
              if (!customName.trim()) return;
              saveMeds([{ id: store.id(), name: customName.trim(), dose: customDose.trim() }, ...meds]);
              setCustomName("");
              setCustomDose("");
            }}
            returnKeyType="done"
          />
          {meds.map((m) => {
            const log = medLog.find((l) => l.date === today && l.medId === m.id && l.taken);
            const taken = !!log;
            const when = log?.time ? new Date(log.time) : null;
            const stamp = when && !Number.isNaN(when.getTime())
              ? when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
              : "";
            return (
              <View key={m.id} style={styles.medRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: taken }}
                  accessibilityLabel={`${m.name}${m.dose ? `, ${m.dose}` : ""}`}
                  style={styles.med}
                  onPress={() => {
                    const next = taken
                      ? medLog.filter((l) => !(l.date === today && l.medId === m.id))
                      : [...medLog, { id: store.id(), date: today, medId: m.id, taken: true, time: new Date().toISOString() }];
                    saveMedLog(next);
                  }}
                >
                  <Text style={styles.symLabel}>
                    {taken ? "☑" : "☐"} {m.name}{m.dose ? ` · ${m.dose}` : ""}
                    {stamp ? `\n${stamp}` : ""}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${m.name}`}
                  onPress={() => {
                    saveMeds(meds.filter((item) => item.id !== m.id)).catch(() => {});
                    saveMedLog(medLog.filter((l) => l.medId !== m.id)).catch(() => {});
                  }}
                  hitSlop={8}
                  style={styles.symRemove}
                >
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            );
          })}
          <Pressable onPress={() => setShowMeds((v) => !v)}>
            <Text style={styles.link}>{showMeds ? "Hide common list" : "Add from common prescriptions"}</Text>
          </Pressable>
          {showMeds
            ? COMMON_MEDS.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    saveMeds([{ id: store.id(), name, dose: "" }, ...meds]);
                    setShowMeds(false);
                  }}
                >
                  <Text style={styles.option}>{name}</Text>
                </Pressable>
              ))
            : null}
        </Card>

        <Card style={{ marginTop: 12 }} color="rgba(211,228,235,0.78)">
          <Text style={styles.kicker}>Journal</Text>
          <Text style={styles.soft}>Write a few words about today if you want. Short is fine. This stays on this device.</Text>
          <TextInput value={note} onChangeText={setNote} style={styles.input} multiline placeholder="What stood out today" placeholderTextColor={colors.muted} />
          <Text style={styles.soft}>A kinder sentence, if one comes. You can leave this blank.</Text>
          <TextInput value={reframe} onChangeText={setReframe} style={styles.input} multiline placeholder="Optional" placeholderTextColor={colors.muted} />
        </Card>

        <PrimaryButton label="Save today's check-in" onPress={save} />
        <Text style={styles.saved}>
          {savedNote || "Check-ins are saved on this device only, in StillMind’s private storage. They are not sent anywhere."}
        </Text>
        {checkins.length ? (
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.kicker}>Saved check-ins</Text>
            {checkins.slice(0, 8).map((row) => (
              <View key={row.id} style={styles.medRow}>
                <Text style={styles.symLabel}>{row.date} · mood {Math.min(5, row.mood)} · {row.sleepHours.toFixed(1)} hrs</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete check-in from ${row.date}`}
                  onPress={() => deleteCheckIn(row.id).catch(() => {})}
                  hitSlop={8}
                >
                  <Text style={styles.remove}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}
        <Pressable onPress={() => router.push("/report")} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={styles.link}>Generate healthcare summary</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
    </ImageBackground>
  );
}

function CircleChoice({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={onPress} style={styles.sym}>
      <View style={[styles.dot, value && styles.dotOn]} />
      <Text style={styles.symLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.titleBold, fontSize: 26, color: colors.ink, marginTop: 10 },
  lead: { fontFamily: fonts.body, color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: 6, marginBottom: 8 },
  sub: { fontFamily: fonts.body, color: colors.muted, marginBottom: 4 },
  kicker: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 16, marginBottom: 8 },
  mood: { fontFamily: fonts.titleLight, fontSize: 28, color: colors.ink },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  bar: { flex: 1, height: 10, backgroundColor: colors.creamDeep, borderRadius: 5, overflow: "hidden" },
  fill: { height: 10, backgroundColor: colors.lavender },
  nudge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" },
  drop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.linen,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  dropText: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 14 },
  dropItem: { paddingVertical: 8, paddingHorizontal: 4 },
  sym: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  symBlock: { paddingVertical: 8, gap: 8 },
  symHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  dots: { flexDirection: "row", alignItems: "center", gap: 10 },
  symRemove: { paddingVertical: 2, paddingLeft: 8 },
  symLabel: { fontFamily: fonts.body, color: colors.ink, flex: 1, paddingRight: 8 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(251,249,245,0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(111,138,100,0.45)",
  },
  dotOn: { backgroundColor: colors.sage, borderColor: colors.sage },
  sleep: { fontFamily: fonts.titleBold, fontSize: 28, color: colors.ink },
  medRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  med: { flex: 1, paddingVertical: 6 },
  remove: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  link: { fontFamily: fonts.bodyMed, color: colors.sageDeep },
  saved: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 8, textAlign: "center" },
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
  medInput: {
    backgroundColor: colors.linen,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    fontFamily: fonts.body,
    color: colors.ink,
  },
});
