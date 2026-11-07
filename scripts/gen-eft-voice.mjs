import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tts } from "edge-tts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets", "audio");

const lines = [
  ["karate", "Side of the hand. Use the fingertips of your other hand. Tap the side of this hand."],
  ["brow", "Eyebrow. Two fingertips. Tap lightly where the brow begins."],
  ["sideEye", "Side of the eye. Index and middle finger, on the bone beside the eye."],
  ["underEye", "Under the eye. Two fingertips. Gentle rain."],
  ["nose", "Under the nose. Index fingertip. Very light."],
  ["chin", "Chin. Index and middle finger, in the crease of the chin."],
  ["collar", "Collarbone. Four fingertips, just below the hollow."],
  ["underArm", "Under the arm. Four fingertips, on the side of the ribs."],
  ["crown", "Top of the head. Fingertips gathered. Tap the crown, as if rain were landing."],
];

await mkdir(outDir, { recursive: true });

for (const [id, text] of lines) {
  const audio = await tts(text, {
    voice: "en-GB-SoniaNeural",
    rate: "-18%",
    pitch: "-3Hz",
    volume: "+0%",
  });
  const dest = join(outDir, `eft-voice-${id}.mp3`);
  await writeFile(dest, audio);
  console.log("wrote", dest, audio.length);
}
