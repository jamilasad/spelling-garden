// Makes speech louder and even, so words are easy to hear on tablets and phones.
// Raises the speech level to about -11 dBFS and limits peaks to -1 dBFS (no crackle).
// Uses the Mac's built-in afconvert to decode and re-encode (AAC .m4a).
import { readFile, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const TARGET_RMS = 10 ** (-11 / 20);   // speech level
const CEILING = 10 ** (-1 / 20);       // peak limit
const MAX_GAIN = 10 ** (18 / 20);      // never boost more than 18 dB

function readWav(buf) {
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    if (id === 'data') data = buf.subarray(pos + 8, pos + 8 + size);
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error('expected 16-bit PCM wav');
  const samples = new Float32Array(data.length / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = data.readInt16LE(i * 2) / 32768;
  return { ...fmt, samples };
}

function writeWav({ channels, rate, samples }) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * channels * 2, 28); h.writeUInt16LE(channels * 2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/** Speech-only loudness (ignores the quiet gaps), then gain + a smooth peak limiter. */
export function louder(samples, rate) {
  const win = Math.round(rate * 0.02);
  let sum = 0, count = 0;
  for (let i = 0; i < samples.length; i += win) {
    let e = 0;
    const end = Math.min(samples.length, i + win);
    for (let j = i; j < end; j++) e += samples[j] * samples[j];
    const rms = Math.sqrt(e / (end - i));
    if (rms > 0.01) { sum += e; count += end - i; }
  }
  const speechRms = count ? Math.sqrt(sum / count) : 0;
  const gain = speechRms > 0 ? Math.min(MAX_GAIN, TARGET_RMS / speechRms) : 1;

  const out = new Float32Array(samples.length);
  const attack = Math.exp(-1 / (rate * 0.002));
  const release = Math.exp(-1 / (rate * 0.08));
  const look = Math.round(rate * 0.003);
  let env = 0;
  for (let i = 0; i < samples.length; i++) {
    const ahead = Math.abs((samples[Math.min(samples.length - 1, i + look)] || 0) * gain);
    env = ahead > env ? attack * env + (1 - attack) * ahead : release * env + (1 - release) * ahead;
    const g = env > CEILING ? CEILING / env : 1;
    out[i] = Math.max(-CEILING, Math.min(CEILING, samples[i] * gain * g));
  }
  return { out, gainDb: 20 * Math.log10(gain) };
}

/** Converts any audio file to a louder .m4a. */
export async function makeLoud(input, outM4a) {
  const wavIn = `${outM4a}.in.wav`;
  const wavOut = `${outM4a}.out.wav`;
  try {
    await run('afconvert', ['-f', 'WAVE', '-d', 'LEI16', input, wavIn]);
    const wav = readWav(await readFile(wavIn));
    const { out, gainDb } = louder(wav.samples, wav.rate);
    await writeFile(wavOut, writeWav({ ...wav, samples: out }));
    await run('afconvert', ['-f', 'm4af', '-d', 'aac@44100', '-b', '96000', wavOut, outM4a]);
    return gainDb;
  } finally {
    await rm(wavIn, { force: true });
    await rm(wavOut, { force: true });
  }
}
