import fs from "fs";

const path = "C:/Users/rignj/Projects/StillMind/assets/audio/ember-drone.wav";
const sr = 22050;
const loopSec = 16;
const n = Math.round(sr * loopSec);

function snap(f) {
  const cycles = Math.max(1, Math.round((f * n) / sr));
  return (cycles * sr) / n;
}

const voices = [
  { f: snap(82.41), a: 0.16, pan: -0.2 }, // E2
  { f: snap(98.0), a: 0.18, pan: 0.12 }, // G2
  { f: snap(123.47), a: 0.055, pan: -0.08 }, // B2
  { f: snap(146.83), a: 0.045, pan: 0.2 }, // D3
  { f: snap(164.81), a: 0.12, pan: -0.16 }, // E3
  { f: snap(196.0), a: 0.14, pan: 0.14 }, // G3
  { f: snap(246.94), a: 0.035, pan: 0.06 }, // B3
];

const L = new Float64Array(n);
const R = new Float64Array(n);

for (let i = 0; i < n; i++) {
  const t = i / sr;
  for (const v of voices) {
    const s = v.a * (Math.sin(2 * Math.PI * v.f * t) + 0.05 * Math.sin(2 * Math.PI * v.f * 2 * t));
    L[i] += s * ((1 - v.pan) * 0.5);
    R[i] += s * ((1 + v.pan) * 0.5);
  }
}

let peak = 1e-9;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = 0.32 / peak;

const buf = Buffer.alloc(44 + n * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + n * 4, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(sr, 24);
buf.writeUInt32LE(sr * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(n * 4, 40);

for (let i = 0; i < n; i++) {
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, (L[i] * gain * 32767) | 0)), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, (R[i] * gain * 32767) | 0)), 44 + i * 4 + 2);
}

fs.writeFileSync(path, buf);
console.log("wrote", path, "bytes", buf.length, "sec", loopSec, "peakIn", peak.toFixed(3));
console.log("hz", voices.map((v) => v.f.toFixed(3)).join(", "));
