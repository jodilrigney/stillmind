import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "audio", "meditate");
const lines = [
  "Lie still. Let the bed hold you. You do not have to fall asleep.",
  "Breathe in slowly through your nose. Then breathe out a little longer than you breathed in.",
  "Once more. A gentle breath in. Then a slower breath out.",
  "Let your forehead, eyes, and jaw go soft.",
  "Let your shoulders drop. Let your arms and hands get heavy.",
  "Feel your back and belly rest. Let your legs and feet sink into the bed.",
  "If a thought comes, notice it, then come back to the slow breath out. Rest still counts.",
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "edge-tts-"));
const npm = spawnSync("npm", ["install", "--silent", "node-edge-tts"], {
  cwd: tmp,
  stdio: "inherit",
  shell: true,
});
if (npm.status !== 0) process.exit(npm.status ?? 1);

const require = createRequire(path.join(tmp, "package.json"));
const { EdgeTTS } = require("node-edge-tts");

for (let i = 0; i < lines.length; i++) {
  const out = path.join(outDir, `sleep-${i}.mp3`);
  console.log(`Writing ${out}\n  ${lines[i]}`);
  const tts = new EdgeTTS({
    voice: "en-GB-SoniaNeural",
    lang: "en-GB",
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
    pitch: "-4Hz",
    rate: "-20%",
    timeout: 30000,
  });
  await tts.ttsPromise(lines[i], out);
  const size = fs.statSync(out).size;
  console.log(`  ${size} bytes`);
  if (size < 16000) {
    console.error("Clip is too short; aborting.");
    process.exit(1);
  }
}
