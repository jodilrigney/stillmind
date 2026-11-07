import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EdgeTTS } from "node-edge-tts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets", "audio", "meditate");

const sessions = [
  {
    id: "anxiety",
    lines: [
      "Let the scene be wider than the thought.",
      "Notice where your body is supported right now.",
      "Breathe in gently. Let the exhale leave on its own.",
      "Unclench the jaw and let the shoulders become a little heavier.",
      "A feeling can be present without becoming the whole moment.",
      "You do not have to solve what comes next.",
      "Stay with one quiet breath at a time.",
    ],
  },
  {
    id: "grounding",
    lines: [
      "Feel the weight of your body being held.",
      "Let your eyes rest on one neutral shape nearby.",
      "Notice three textures without needing to name them perfectly.",
      "Feel the contact beneath your feet, hands, or back.",
      "Your body can be heavy for this moment. That is enough.",
      "Listen for one sound close by and one farther away.",
      "Come back to the contact points.",
    ],
  },
  {
    id: "sleep",
    lines: [
      "Dim the inner lights. Nothing has to be finished.",
      "Lengthen the exhale like a tide going out.",
      "If a thought arrives, set it on the shore.",
      "Let the body become a little heavier in the bed or chair.",
      "You do not have to fall asleep for rest to count.",
      "If the mind wanders, return to the next slow breath.",
      "Let sleep be optional. Rest is the practice.",
    ],
  },
  {
    id: "stress",
    lines: [
      "Unhook from the next task for these minutes.",
      "Warm the hands. Loosen the jaw.",
      "Breathe into the sides of the ribs.",
      "Let the shoulders drop a little more than usual.",
      "You can notice effort without carrying all of it.",
      "Return to the sound of air leaving.",
      "You can return to your life a little wider.",
    ],
  },
  {
    id: "body-scan",
    lines: [
      "Find a comfortable position. Sitting or lying down both work.",
      "If a part of the body is hard to feel, skip it and stay with what is available.",
      "Notice the contact of your feet or the surface beneath you.",
      "Move attention slowly through the legs, without needing to change anything.",
      "Notice the belly rising and falling, even a little.",
      "Let the shoulders, jaw, and forehead soften if they can.",
      "If sensation is strong, stay with the breath and skip ahead.",
      "Rest in the whole body being here, just as it is.",
    ],
  },
  {
    id: "kindness",
    lines: [
      "Begin with yourself, using words that feel honest rather than forced.",
      "May I be safe.",
      "May I be kind with myself.",
      "May I meet this moment with a little more ease.",
      "If it feels right, offer the same wish to someone who is easy to care for.",
      "May you be safe. May you have enough ease for today.",
      "If a harder person comes to mind, you can skip that and return to yourself.",
      "Rest in the warmth of one simple wish: may I be well enough for now.",
    ],
  },
];

await mkdir(outDir, { recursive: true });

for (const session of sessions) {
  for (const [index, text] of session.lines.entries()) {
    const dest = join(outDir, `${session.id}-${index}.mp3`);
    const tts = new EdgeTTS({
      voice: "en-GB-SoniaNeural",
      lang: "en-GB",
      outputFormat: "audio-24khz-48kbitrate-mono-mp3",
      pitch: "-3Hz",
      rate: "-18%",
      volume: "+0%",
      timeout: 20000,
    });
    await tts.ttsPromise(text, dest);
    console.log("wrote", dest);
  }
}
