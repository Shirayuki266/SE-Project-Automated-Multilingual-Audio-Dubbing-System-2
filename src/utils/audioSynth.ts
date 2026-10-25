/**
 * Buddhist Temple Bell Audio Synthesizer (Pure TypeScript / Node.js Buffer)
 * Produces authentic 16-bit PCM WAV audio with additive physical harmonic modeling.
 * Acts as high-performance zero-dependency synthesizer & reliable fallback.
 */

export function generateTempleBellWav(
  baseFreq: number = 220.0,
  durationSeconds: number = 2.8,
  sampleRate: number = 44100
): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // "data" subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const harmonics = [
    [1.0, 0.65, 0.7],
    [2.76, 0.4, 0.9],
    [5.4, 0.2, 1.4],
    [8.9, 0.08, 2.0],
  ];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0.0;

    for (const [freqMult, amp, decayRate] of harmonics) {
      const freq = baseFreq * freqMult;
      const envelope = Math.exp(-t * (decayRate * 2.2));
      const vibrato = 1.0 + 0.003 * Math.sin(2.0 * Math.PI * 5.0 * t);
      sampleVal += amp * envelope * Math.sin(2.0 * Math.PI * (freq * vibrato) * t);
    }

    const clamped = Math.max(-0.95, Math.min(0.95, sampleVal));
    const intSample = Math.round(clamped * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}
