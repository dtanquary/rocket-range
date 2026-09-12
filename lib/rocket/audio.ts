import type { Motor } from "./catalog";

type Vector = { x: number; y: number; z: number };

// Small black-powder motor sound design, not a recording or an acoustic model.
// There are no bass oscillators, rumble loops, or artificial reverberation.
function filter(
  type: "highpass" | "lowpass" | "bandpass",
  frequency: number,
  sampleRate: number,
  q = Math.SQRT1_2,
) {
  const w = (2 * Math.PI * Math.min(frequency, sampleRate * 0.42)) / sampleRate;
  const c = Math.cos(w),
    alpha = Math.sin(w) / (2 * q),
    a0 = 1 + alpha;
  const b0 =
    (type === "highpass"
      ? (1 + c) / 2
      : type === "lowpass"
        ? (1 - c) / 2
        : alpha) / a0;
  const b1 =
    (type === "highpass" ? -(1 + c) : type === "lowpass" ? 1 - c : 0) / a0;
  const b2 = type === "bandpass" ? -b0 : b0;
  const a1 = (-2 * c) / a0,
    a2 = (1 - alpha) / a0;
  let z1 = 0,
    z2 = 0;
  return (input: number) => {
    const output = b0 * input + z1;
    z1 = b1 * input - a1 * output + z2;
    z2 = b2 * input - a2 * output;
    return output;
  };
}

/** Mono PCM: a thrust-shaped hiss with brief grains of crackle and a soft ignition snap. */
export function motorSoundSamples(
  motor: Motor,
  sampleRate: number,
  seed = 731,
) {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000)
    throw new Error("Motor audio needs a sample rate of at least 8 kHz");
  const samples = new Float32Array(Math.ceil(motor.burn * sampleRate));
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const size = Math.max(0, Math.min(1, Math.log2(motor.impulse / 2) / 5));
  const peakThrust = Math.max(...motor.curve.map((p) => p[1]));
  const highpass = filter("highpass", 420 - size * 170, sampleRate);
  const lowpass = filter("lowpass", 8800 - size * 2600, sampleRate);
  const rasp = filter("bandpass", 2100 - size * 650, sampleRate, 0.8);
  const flutter = filter("lowpass", 65, sampleRate);
  let segment = 1,
    crackle = 0;
  const crackleDecay = Math.exp(-1 / (sampleRate * (0.0009 + size * 0.0007)));
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    while (segment < motor.curve.length - 1 && t > motor.curve[segment][0])
      segment++;
    const [t0, f0] = motor.curve[segment - 1],
      [t1, f1] = motor.curve[segment];
    const thrust = Math.max(
      0,
      f0 + (f1 - f0) * Math.min(1, (t - t0) / (t1 - t0)),
    );
    const envelope =
      Math.pow(thrust / peakThrust, 0.6) *
      Math.min(1, t / 0.004) *
      Math.min(1, (motor.burn - t) / 0.018);
    const noise = random() * 2 - 1;
    // Sparse, millisecond grains prevent this from sounding like a steady fan.
    if (random() < (110 + size * 90) / sampleRate)
      crackle = (random() * 2 - 1) * (0.3 + random() * 0.7);
    crackle *= crackleDecay;
    const texture =
      noise * (0.78 + flutter(noise) * 1.4) +
      rasp(noise) * 0.28 +
      crackle * 1.3;
    const ignition = noise * Math.exp(-t / 0.012) * 0.22;
    samples[i] = lowpass(
      highpass(
        (texture * envelope + ignition * Math.min(1, t / 0.002)) *
          (0.25 + size * 0.13),
      ),
    );
  }
  // Remove the last few samples smoothly; the motor is silent at curve burnout.
  const fade = Math.min(samples.length, Math.round(sampleRate * 0.004));
  for (let i = 0; i < fade; i++)
    samples[samples.length - fade + i] *= 1 - i / (fade - 1);
  return samples;
}

type EngineVoice = {
  source: AudioBufferSourceNode;
  panner: PannerNode;
  air: BiquadFilterNode;
  release: () => void;
};

/** Owns browser audio resources. Construction is safe during server rendering. */
export class RangeAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private engine: EngineVoice | null = null;
  private voices = new Set<() => void>();
  private launchNumber = 0;
  private emitter: Vector = { x: 0, y: 0.2, z: 0 };
  private listener: Vector = { x: 6, y: 1.65, z: 9 };
  private forward: Vector = { x: 0, y: 0, z: -1 };
  private up: Vector = { x: 0, y: 1, z: 0 };

  private activate() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.8;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
      return this.context;
    } catch {
      // Audio is optional; unsupported devices can still fly the rocket.
      return null;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.master || !this.context) return;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(
      muted ? 0 : 0.8,
      this.context.currentTime,
      0.015,
    );
  }

  beep(frequency = 660, duration = 0.09, volume = 0.06) {
    if (this.muted) return;
    const ctx = this.activate();
    if (!ctx) return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(this.master!);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const release = () => {
      oscillator.onended = null;
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
      this.voices.delete(release);
    };
    oscillator.onended = release;
    this.voices.add(release);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  /** Call directly from the launch gesture, including muted launches. */
  ignite(motor: Motor) {
    const ctx = this.activate();
    if (!ctx) return;
    this.engine?.release();
    const pcm = motorSoundSamples(
      motor,
      ctx.sampleRate,
      731 + this.launchNumber++,
    );
    const buffer = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
    buffer.getChannelData(0).set(pcm);
    const source = ctx.createBufferSource(),
      air = ctx.createBiquadFilter(),
      panner = ctx.createPanner();
    source.buffer = buffer;
    air.type = "lowpass";
    air.Q.value = 0.5;
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 8;
    panner.maxDistance = 8000;
    panner.rolloffFactor = 0.9;
    source.connect(air);
    air.connect(panner);
    panner.connect(this.master!);
    const voice: EngineVoice = {
      source,
      air,
      panner,
      release: () => {
        source.onended = null;
        source.stop();
        source.disconnect();
        air.disconnect();
        panner.disconnect();
        this.voices.delete(voice.release);
        if (this.engine === voice) this.engine = null;
      },
    };
    source.onended = voice.release;
    this.engine = voice;
    this.voices.add(voice.release);
    this.applySpatial();
    source.start();
  }

  updateSpatial(
    emitter: Vector,
    listener: Vector,
    forward: Vector,
    up: Vector,
  ) {
    Object.assign(this.emitter, emitter);
    Object.assign(this.listener, listener);
    Object.assign(this.forward, forward);
    Object.assign(this.up, up);
    this.applySpatial();
  }

  private applySpatial() {
    const ctx = this.context,
      voice = this.engine;
    if (!ctx || !voice) return;
    const listener = ctx.listener;
    const set = (param: AudioParam, value: number) => {
      param.setTargetAtTime(value, ctx.currentTime, 0.015);
    };
    set(voice.panner.positionX, this.emitter.x);
    set(voice.panner.positionY, this.emitter.y);
    set(voice.panner.positionZ, this.emitter.z);
    set(listener.positionX, this.listener.x);
    set(listener.positionY, this.listener.y);
    set(listener.positionZ, this.listener.z);
    set(listener.forwardX, this.forward.x);
    set(listener.forwardY, this.forward.y);
    set(listener.forwardZ, this.forward.z);
    set(listener.upX, this.up.x);
    set(listener.upY, this.up.y);
    set(listener.upZ, this.up.z);
    const distance = Math.hypot(
      this.emitter.x - this.listener.x,
      this.emitter.y - this.listener.y,
      this.emitter.z - this.listener.z,
    );
    set(voice.air.frequency, 1600 + 8500 * Math.exp(-distance / 220));
  }

  dispose() {
    for (const release of this.voices) release();
    this.master?.disconnect();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}
