import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { SymptomDef, symptomName } from "../src/data";
import { CheckIn, DoctorNote, JournalEntry, Med, MedLog, store } from "../src/storage";
import { colors, fonts } from "../src/theme";

function downloadAndOpenText(filename: string, text: string) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.open(url, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
}

async function shareTextFileOnWeb(filename: string, text: string) {
  if (typeof navigator === "undefined") return false;
  const file = new File([text], filename, { type: "text/plain" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: filename, text: "StillMind summary" });
    return true;
  }
  return false;
}

async function writeNativeText(filename: string, text: string) {
  const FileSystem = await import("expo-file-system");
  const folder = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  const path = `${folder}${filename}`;
  await FileSystem.writeAsStringAsync(path, text);
  return path;
}

function moodWord(avg: number) {
  if (avg >= 8) return "Good";
  if (avg >= 5) return "Okay";
  return "Heavy";
}

function joinList(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function daysPhrase(count: number) {
  return count === 1 ? "1 day" : `${count} days`;
}

function parseDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDay(iso: string) {
  const date = parseDay(iso);
  if (!date) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStamp(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fileStamp(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function sortedDays(week: CheckIn[]) {
  return [...week].sort((a, b) => a.date.localeCompare(b.date));
}

function dateRange(week: CheckIn[]) {
  const days = sortedDays(week).map((row) => row.date);
  if (!days.length) return "";
  if (days[0] === days[days.length - 1]) return formatDay(days[0]);
  return `${formatDay(days[0])} – ${formatDay(days[days.length - 1])}`;
}

function buildOverview({
  week,
  meds,
  medLog,
  journal,
  questions,
  updates,
  concerns,
  customSymptoms,
  generatedAt,
}: {
  week: CheckIn[];
  meds: Med[];
  medLog: MedLog[];
  journal: JournalEntry[];
  questions: string;
  updates: string;
  concerns: string;
  customSymptoms: SymptomDef[];
  generatedAt: Date;
}) {
  const lines: string[] = [];
  lines.push(`Generated ${formatStamp(generatedAt)}.`);
  if (!week.length) {
    lines.push("No check-ins were logged in this window.");
    return lines.join("\n");
  }

  const days = sortedDays(week);
  lines.push(`Dates covered: ${dateRange(week)}.`);
  lines.push(
    `${week.length === 1 ? "1 day was" : `${week.length} days were`} logged: ${joinList(days.map((row) => formatDay(row.date)))}.`,
  );

  const moodAvg = week.reduce((sum, row) => sum + row.mood, 0) / week.length;
  lines.push(`Mood averaged ${moodAvg.toFixed(1)} (${moodWord(moodAvg)}).`);

  const sleepAvg = week.reduce((sum, row) => sum + row.sleepHours, 0) / week.length;
  const hardDays = week.filter((row) => row.hardToSleep).length;
  const wakeDays = week.filter((row) => row.nightWakes).length;
  let sleep = `Sleep averaged ${sleepAvg.toFixed(1)} hours.`;
  if (hardDays) sleep += ` Difficulty falling asleep was noted on ${daysPhrase(hardDays)}.`;
  if (wakeDays) sleep += ` Night waking was noted on ${daysPhrase(wakeDays)}.`;
  lines.push(sleep);

  const feelings = Array.from(new Set(week.flatMap((row) => row.tags).filter(Boolean)));
  lines.push(feelings.length ? `Feelings named: ${joinList(feelings)}.` : "No feeling words were named.");

  const symptoms = Array.from(new Set(week.flatMap((row) => Object.keys(row.symptoms || {}))))
    .map((id) => {
      const avg = week.reduce((sum, row) => sum + (row.symptoms[id] || 0), 0) / week.length;
      return { label: symptomName(id, customSymptoms), avg };
    })
    .filter((item) => item.avg > 0)
    .sort((a, b) => b.avg - a.avg);
  if (symptoms.length) {
    const top = symptoms.slice(0, 4).map((item) => `${item.label} (${item.avg.toFixed(1)}/3)`);
    lines.push(`Symptoms most present: ${joinList(top)}.`);
  } else {
    lines.push("No symptoms were marked as present.");
  }

  const taken = meds.filter((med) => medLog.some((log) => log.medId === med.id && log.taken));
  if (!meds.length) lines.push("No medications or supplements were listed.");
  else if (!taken.length) lines.push("Medications were listed, but none were marked as taken in this window.");
  else lines.push(`Medications marked as taken: ${joinList(taken.map((med) => med.name))}.`);

  if (journal[0]?.text?.trim()) {
    lines.push(
      journal[0].date
        ? `A journal note from ${formatDay(journal[0].date)} was included.`
        : "A journal note from the latest entry was included.",
    );
  }
  if (questions.trim() || updates.trim() || concerns.trim()) {
    lines.push("Notes for a clinician were added.");
  }
  lines.push("This is a snapshot of what was logged. It is not a diagnosis.");
  return lines.join("\n");
}

function buildDetails({
  week,
  meds,
  medLog,
  journal,
  questions,
  updates,
  concerns,
  customSymptoms,
  generatedAt,
}: {
  week: CheckIn[];
  meds: Med[];
  medLog: MedLog[];
  journal: JournalEntry[];
  questions: string;
  updates: string;
  concerns: string;
  customSymptoms: SymptomDef[];
  generatedAt: Date;
}) {
  const moodAvg = week.length ? (week.reduce((s, c) => s + c.mood, 0) / week.length).toFixed(1) : "n/a";
  const sleepAvg = week.length
    ? (week.reduce((s, c) => s + c.sleepHours, 0) / week.length).toFixed(1)
    : "n/a";
  const tags = Array.from(new Set(week.flatMap((c) => c.tags))).join(", ") || "none logged";
  const loggedIds = Array.from(new Set(week.flatMap((c) => Object.keys(c.symptoms || {}))));
  const symptomBits = loggedIds
    .map((id) => {
      const vals = week.map((c) => c.symptoms[id] || 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return `${symptomName(id, customSymptoms)}: ${avg.toFixed(1)}/3`;
    })
    .join("\n");
  const medLines = meds
    .map((m) => {
      const takenLogs = medLog.filter((l) => l.medId === m.id && l.taken);
      const last = [...takenLogs].reverse().find((l) => l.time);
      const lastBit = last?.time ? ` · last ${formatStamp(new Date(last.time))}` : "";
      return `${m.name} ${m.dose} · logged ${takenLogs.length} times${lastBit}`;
    })
    .join("\n");
  const dayLines = sortedDays(week)
    .map((row) => {
      const bits = [`mood ${row.mood}`, `sleep ${row.sleepHours.toFixed(1)} hrs`];
      if (row.tags.length) bits.push(row.tags.join(", "));
      return `${formatDay(row.date)} — ${bits.join(" · ")}`;
    })
    .join("\n");
  const journalLabel = journal[0]?.date ? `Journal (${formatDay(journal[0].date)}):` : "Journal (latest):";
  return [
    "StillMind weekly summary (generated on-device)",
    `Generated: ${formatStamp(generatedAt)}`,
    week.length ? `Dates covered: ${dateRange(week)}` : "Dates covered: none logged",
    "Days logged:",
    dayLines || "none",
    `Mood average (up to 7 days): ${moodAvg}`,
    `Sleep average: ${sleepAvg} hrs`,
    `Emotion tags: ${tags}`,
    "Symptoms:",
    symptomBits || "none logged",
    "Medications:",
    medLines || "none",
    journalLabel,
    journal[0]?.text || "none",
    journal[0]?.reframe ? `Reframe: ${journal[0].reframe}` : "",
    "Notes for clinician:",
    `Questions: ${questions}`,
    `Updates: ${updates}`,
    `Concerns: ${concerns}`,
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");
}

const privacy = "Privacy: this file was built locally. Share only with someone you choose.";

function packSummary(input: Parameters<typeof buildOverview>[0]) {
  const details = buildDetails(input);
  const overview = buildOverview(input);
  return { details, overview, summary: [details, "", "Overview", overview, "", privacy].join("\n") };
}

export default function Report() {
  const {
    checkins,
    meds,
    medLog,
    journal,
    doctor,
    saveDoctor,
    customSymptoms,
    session,
    summarySaves,
    saveSummarySaves,
  } = useApp();
  const last = doctor[0];
  const [questions, setQuestions] = useState(last?.questions ?? "");
  const [updates, setUpdates] = useState(last?.updates ?? "");
  const [concerns, setConcerns] = useState(last?.concerns ?? "");
  const [status, setStatus] = useState("");
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [confirmClear, setConfirmClear] = useState(false);
  const usedGoogle = session?.provider === "google-local";

  const week = useMemo(() => checkins.slice(0, 7), [checkins]);
  const packed = useMemo(
    () =>
      packSummary({
        week,
        meds,
        medLog,
        journal,
        questions,
        updates,
        concerns,
        customSymptoms,
        generatedAt,
      }),
    [week, meds, medLog, journal, questions, updates, concerns, customSymptoms, generatedAt],
  );
  const { details, overview } = packed;
  const lastSaved = summarySaves[0]?.savedAt ? formatStamp(new Date(summarySaves[0].savedAt)) : "";

  const logSave = async (when: Date, text: string) => {
    const note: DoctorNote = {
      id: store.id(),
      date: store.today(),
      savedAt: when.toISOString(),
      questions,
      updates,
      concerns,
    };
    await saveDoctor([note, ...doctor]);
    await saveSummarySaves(
      [
        { id: note.id, savedAt: when.toISOString(), questions, updates, concerns, text },
        ...summarySaves,
      ].slice(0, 20),
    );
  };

  const deliver = async (kind: "file" | "drive", filename: string, text: string) => {
    if (Platform.OS === "web") {
      if (kind === "drive") {
        const shared = await shareTextFileOnWeb(filename, text);
        if (!shared) {
          downloadAndOpenText(filename, text);
          Linking.openURL("https://drive.google.com/drive/my-drive").catch(() => {});
        }
        return shared ? "drive-share" : "drive-upload";
      }
      downloadAndOpenText(filename, text);
      return "file";
    }
    const path = await writeNativeText(filename, text);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: "text/plain",
        dialogTitle: kind === "drive" ? "Save to Google Drive" : "Open or save StillMind summary",
      });
    }
    return kind;
  };

  const save = async (kind: "file" | "drive") => {
    const when = new Date();
    setGeneratedAt(when);
    const filename = `stillmind-summary-${fileStamp(when)}.txt`;
    const text = packSummary({
      week,
      meds,
      medLog,
      journal,
      questions,
      updates,
      concerns,
      customSymptoms,
      generatedAt: when,
    }).summary;
    await logSave(when, text);
    const how = await deliver(kind, filename, text);
    if (how === "drive-share") {
      setStatus(`Logged ${formatStamp(when)}. Choose Google Drive in the share list.`);
    } else if (how === "drive-upload") {
      setStatus(
        `Logged ${formatStamp(when)}. A text file was saved and opened. Google Drive is opening so you can upload it — StillMind does not send the file itself.`,
      );
    } else {
      setStatus(`Logged ${formatStamp(when)}. The text file was saved and opened on this device.`);
    }
  };

  const removeSave = async (id: string) => {
    const nextSaves = summarySaves.filter((row) => row.id !== id);
    await saveSummarySaves(nextSaves);
    await saveDoctor(doctor.filter((row) => row.id !== id));
    setConfirmClear(false);
    setStatus("That saved copy was deleted from this device.");
  };

  const clearAllSaves = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setStatus("Tap clear all again to delete every saved copy on this device.");
      return;
    }
    const ids = new Set(summarySaves.map((row) => row.id));
    await saveSummarySaves([]);
    await saveDoctor(doctor.filter((row) => !ids.has(row.id)));
    setConfirmClear(false);
    setStatus("All saved copies were deleted from this device.");
  };

  const clearNotes = () => {
    setQuestions("");
    setUpdates("");
    setConcerns("");
    setConfirmClear(false);
    setStatus("Notes were cleared. Saved copies are unchanged until you delete them.");
  };

  const copy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const when = new Date();
      setGeneratedAt(when);
      await navigator.clipboard.writeText(
        packSummary({
          week,
          meds,
          medLog,
          journal,
          questions,
          updates,
          concerns,
          customSymptoms,
          generatedAt: when,
        }).summary,
      );
      setStatus("Copied, including dates and the overview. Paste it wherever you like.");
    }
  };

  return (
    <SessionShell title="SHARE" subtitle="Doctor notes & weekly report">
      <Text style={styles.copy}>
        Type notes, then save. Each save is dated. A text file opens so you can keep it on this computer or phone.
        {usedGoogle
          ? " You can also add that file to Google Drive — StillMind still does not upload it on its own."
          : ""}
      </Text>
      <Text style={styles.label}>Questions for your doctor</Text>
      <TextInput value={questions} onChangeText={setQuestions} style={styles.input} multiline />
      <Text style={styles.label}>Symptom / medication updates</Text>
      <TextInput value={updates} onChangeText={setUpdates} style={styles.input} multiline />
      <Text style={styles.label}>Concerns or progress</Text>
      <TextInput value={concerns} onChangeText={setConcerns} style={styles.input} multiline />
      {lastSaved ? <Text style={styles.savedStamp}>Last saved {lastSaved}</Text> : <Text style={styles.savedStamp}>Not saved yet. Dates are logged when you save.</Text>}
      {questions || updates || concerns ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear notes" onPress={clearNotes} hitSlop={8}>
          <Text style={styles.link}>Clear notes</Text>
        </Pressable>
      ) : null}
      <Card color={colors.sageSoft} style={{ marginTop: 12 }}>
        <Text style={styles.pre}>{details}</Text>
      </Card>
      <Card color={colors.waterSoft} style={{ marginVertical: 12 }}>
        <Text style={styles.kicker}>Overview</Text>
        <Text style={styles.pre}>{overview}</Text>
      </Card>
      <Text style={styles.privacy}>{privacy}</Text>
      <PrimaryButton label="Save & open text file" onPress={() => save("file")} />
      {usedGoogle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save to Google Drive"
          onPress={() => save("drive")}
          style={styles.driveBtn}
        >
          <Text style={styles.driveText}>Save to Google Drive</Text>
        </Pressable>
      ) : null}
      {Platform.OS === "web" ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Copy summary" onPress={copy} style={styles.copyBtn}>
          <Text style={styles.link}>Copy summary</Text>
        </Pressable>
      ) : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {summarySaves.length ? (
        <Card color={colors.peachSoft} style={{ marginTop: 16 }}>
          <Text style={styles.kicker}>Saved copies</Text>
          <Text style={styles.soft}>Each save is kept on this device with its date and time. Deleting here does not remove a file you already downloaded.</Text>
          {summarySaves.map((row) => (
            <View key={row.id} style={styles.historyRow}>
              <Text style={styles.historyText}>{formatStamp(new Date(row.savedAt))}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open save from ${formatStamp(new Date(row.savedAt))}`}
                onPress={() =>
                  deliver("file", `stillmind-summary-${fileStamp(new Date(row.savedAt))}.txt`, row.text).then(() =>
                    setStatus(`Opened the copy from ${formatStamp(new Date(row.savedAt))}.`),
                  )
                }
                hitSlop={8}
              >
                <Text style={styles.link}>Open</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete save from ${formatStamp(new Date(row.savedAt))}`}
                onPress={() => removeSave(row.id)}
                hitSlop={8}
                style={styles.historyRemove}
              >
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmClear ? "Tap again to clear all saved copies" : "Clear all saved copies"}
            onPress={clearAllSaves}
            style={styles.clearAll}
          >
            <Text style={styles.remove}>{confirmClear ? "Tap again to clear all" : "Clear all saved copies"}</Text>
          </Pressable>
        </Card>
      ) : null}
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginBottom: 12, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMed, color: colors.ink, marginBottom: 4 },
  input: { backgroundColor: colors.paper, borderRadius: 14, padding: 10, minHeight: 44, marginBottom: 8, fontFamily: fonts.body, color: colors.ink },
  kicker: { fontFamily: fonts.titleBold, color: colors.ink, fontSize: 16, marginBottom: 8 },
  pre: { fontFamily: fonts.body, color: colors.ink, fontSize: 13, lineHeight: 20 },
  privacy: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 14 },
  savedStamp: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, marginBottom: 4, marginTop: -4 },
  copyBtn: { marginTop: 12, alignItems: "center" },
  driveBtn: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.water,
  },
  driveText: { fontFamily: fonts.bodyBold, color: colors.linen, fontSize: 16 },
  link: { fontFamily: fonts.bodyMed, color: colors.sageDeep },
  status: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: "center" },
  soft: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(61,57,51,0.08)",
    gap: 10,
  },
  historyText: { fontFamily: fonts.bodyMed, color: colors.ink, fontSize: 13, flex: 1, paddingRight: 4 },
  historyRemove: { paddingLeft: 4 },
  remove: { fontFamily: fonts.bodyMed, color: colors.sageDeep, fontSize: 13 },
  clearAll: { paddingTop: 10, alignSelf: "flex-start" },
});
