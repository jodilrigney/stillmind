import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Notifications from "expo-notifications";
import {
  CheckIn,
  DoctorNote,
  HeldItem,
  JournalEntry,
  Med,
  MedLog,
  GratitudeEntry,
  SafetyPlan,
  Session,
  StuckPoint,
  SupportContact,
  ThoughtRecord,
  loadJson,
  saveJson,
  store,
} from "../storage";

type Settings = { haptics: boolean; keepName: string };

type Ctx = {
  ready: boolean;
  welcomed: boolean;
  session: Session | null;
  settings: Settings;
  checkins: CheckIn[];
  meds: Med[];
  medLog: MedLog[];
  journal: JournalEntry[];
  doctor: DoctorNote[];
  thoughts: ThoughtRecord[];
  stuck: StuckPoint[];
  held: HeldItem[];
  supportContacts: SupportContact[];
  safetyPlan: SafetyPlan;
  gratitude: GratitudeEntry[];
  setWelcomed: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  saveCheckIn: (c: CheckIn) => Promise<void>;
  saveMeds: (m: Med[]) => Promise<void>;
  saveMedLog: (m: MedLog[]) => Promise<void>;
  saveJournal: (j: JournalEntry[]) => Promise<void>;
  saveDoctor: (d: DoctorNote[]) => Promise<void>;
  saveThoughts: (t: ThoughtRecord[]) => Promise<void>;
  saveStuck: (s: StuckPoint[]) => Promise<void>;
  saveHeld: (h: HeldItem[]) => Promise<void>;
  saveSupportContacts: (contacts: SupportContact[]) => Promise<void>;
  saveSafetyPlan: (plan: SafetyPlan) => Promise<void>;
  saveGratitude: (entries: GratitudeEntry[]) => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [welcomed, setWelcomedState] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings>({ haptics: true, keepName: "" });
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [meds, setMeds] = useState<Med[]>([]);
  const [medLog, setMedLog] = useState<MedLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [doctor, setDoctor] = useState<DoctorNote[]>([]);
  const [thoughts, setThoughts] = useState<ThoughtRecord[]>([]);
  const [stuck, setStuck] = useState<StuckPoint[]>([]);
  const [held, setHeld] = useState<HeldItem[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan>({ region: "Canada", helps: "", place: "" });
  const [gratitude, setGratitude] = useState<GratitudeEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [w, s, st, c, m, ml, j, d, t, sp, h, f, contacts, plan, g] = await Promise.all([
        loadJson(store.keys.welcome, false),
        loadJson<Session | null>(store.keys.session, null),
        loadJson<Settings>(store.keys.settings, { haptics: true, keepName: "" }),
        loadJson<CheckIn[]>(store.keys.checkins, []),
        loadJson<Med[]>(store.keys.meds, []),
        loadJson<MedLog[]>(store.keys.medLog, []),
        loadJson<JournalEntry[]>(store.keys.journal, []),
        loadJson<DoctorNote[]>(store.keys.doctor, []),
        loadJson<ThoughtRecord[]>(store.keys.thoughtRecords, []),
        loadJson<StuckPoint[]>(store.keys.stuckPoints, []),
        loadJson<HeldItem[]>(store.keys.held, []),
        loadJson<Record<string, boolean>>(store.keys.foodReminders, {}),
        loadJson<SupportContact[]>(store.keys.supportContacts, []),
        loadJson<SafetyPlan>(store.keys.safetyPlan, { region: "Canada", helps: "", place: "" }),
        loadJson<GratitudeEntry[]>(store.keys.gratitude, []),
      ]);
      setWelcomedState(w);
      setSession(s);
      setSettings(st);
      setCheckins(c);
      setMeds(m);
      setMedLog(ml);
      setJournal(j);
      setDoctor(d);
      setThoughts(t);
      setStuck(sp);
      setHeld(h);
      setSupportContacts(contacts);
      setSafetyPlan(plan);
      setGratitude(g);
      if (Object.keys(f).length) {
        await Promise.all(
          Object.keys(f).map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
        );
        await saveJson(store.keys.foodReminders, {});
      }
      setReady(true);
    })();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      welcomed,
      session,
      settings,
      checkins,
      meds,
      medLog,
      journal,
      doctor,
      thoughts,
      stuck,
      held,
      supportContacts,
      safetyPlan,
      gratitude,
      setWelcomed: async () => {
        setWelcomedState(true);
        await saveJson(store.keys.welcome, true);
      },
      signIn: async (s) => {
        setSession(s);
        await saveJson(store.keys.session, s);
      },
      signOut: async () => {
        setSession(null);
        await saveJson(store.keys.session, null);
      },
      saveCheckIn: async (c) => {
        const next = [c, ...checkins.filter((x) => x.date !== c.date)];
        setCheckins(next);
        await saveJson(store.keys.checkins, next);
      },
      saveMeds: async (m) => {
        setMeds(m);
        await saveJson(store.keys.meds, m);
      },
      saveMedLog: async (m) => {
        setMedLog(m);
        await saveJson(store.keys.medLog, m);
      },
      saveJournal: async (j) => {
        setJournal(j);
        await saveJson(store.keys.journal, j);
      },
      saveDoctor: async (d) => {
        setDoctor(d);
        await saveJson(store.keys.doctor, d);
      },
      saveThoughts: async (t) => {
        setThoughts(t);
        await saveJson(store.keys.thoughtRecords, t);
      },
      saveStuck: async (s) => {
        setStuck(s);
        await saveJson(store.keys.stuckPoints, s);
      },
      saveHeld: async (h) => {
        setHeld(h);
        await saveJson(store.keys.held, h);
      },
      saveSupportContacts: async (contacts) => {
        setSupportContacts(contacts);
        await saveJson(store.keys.supportContacts, contacts);
      },
      saveSafetyPlan: async (plan) => {
        setSafetyPlan(plan);
        await saveJson(store.keys.safetyPlan, plan);
      },
      saveGratitude: async (entries) => {
        setGratitude(entries);
        await saveJson(store.keys.gratitude, entries);
      },
    }),
    [
      ready,
      welcomed,
      session,
      settings,
      checkins,
      meds,
      medLog,
      journal,
      doctor,
      thoughts,
      stuck,
      held,
      supportContacts,
      safetyPlan,
      gratitude,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}
