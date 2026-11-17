import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  session: "still.session",
  welcome: "still.welcome",
  checkins: "still.checkins",
  meds: "still.meds",
  medLog: "still.medLog",
  journal: "still.journal",
  doctor: "still.doctor",
  thoughtRecords: "still.thoughts",
  stuckPoints: "still.stuck",
  held: "still.held",
  foodReminders: "still.foodReminders",
  supportContacts: "still.supportContacts",
  safetyPlan: "still.safetyPlan",
  gratitude: "still.gratitude",
  customSymptoms: "still.customSymptoms",
  summarySaves: "still.summarySaves",
  lightenGuide: "still.lightenGuide",
  settings: "still.settings",
};

export type Session = {
  signedIn: boolean;
  provider: "google-local" | "device";
  name: string;
  email: string;
};

export type CheckIn = {
  id: string;
  date: string;
  mood: number;
  tags: string[];
  symptoms: Record<string, number>;
  sleepHours: number;
  sleepQuality: number;
  nightWakes: boolean;
  hardToSleep: boolean;
  nightNote?: string;
};

export type CustomSymptom = {
  id: string;
  label: string;
};

export type Med = {
  id: string;
  name: string;
  dose: string;
};

export type MedLog = {
  id: string;
  date: string;
  medId: string;
  taken: boolean;
  time?: string;
  sideEffects?: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  text: string;
  reframe?: string;
};

export type DoctorNote = {
  id: string;
  date: string;
  savedAt?: string;
  questions: string;
  updates: string;
  concerns: string;
};

export type SummarySave = {
  id: string;
  savedAt: string;
  questions: string;
  updates: string;
  concerns: string;
  text: string;
};

export type ThoughtRecord = {
  id: string;
  date: string;
  situation: string;
  thought: string;
  emotion: string;
  pattern?: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balanced: string;
  emotionAfter?: string;
};

export type StuckPoint = {
  id: string;
  date: string;
  belief: string;
  challenge: string;
  responsibility: string;
  theme?: string;
  situation?: string;
  emotion?: string;
  beliefBefore?: string;
  evidenceFor?: string;
  evidenceAgainst?: string;
  habitOrFact?: string;
  missingInfo?: string;
  languageCheck?: string;
  feelingOrFact?: string;
  patterns?: string;
  beliefAfter?: string;
  emotionAfter?: string;
};

export type HeldItem = {
  id: string;
  text: string;
  date: string;
};

export type SupportContact = {
  id: string;
  kind: "provider" | "safety";
  name: string;
  role: string;
  organization: string;
  phone: string;
  email: string;
  notes: string;
};

export type SafetyPlan = {
  region: "Canada" | "United States";
  helps: string;
  place: string;
};

export type GratitudeEntry = {
  id: string;
  date: string;
  text: string;
};

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  keys: KEYS,
  today() {
    return new Date().toISOString().slice(0, 10);
  },
  id() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },
};
