type Sound =
  | "click"
  | "cup"
  | "bell"
  | "payment"
  | "ready"
  | "robot"
  | "brew"
  | "steam"
  | "upgrade";
type Foley =
  | "door"
  | "tamp"
  | "latch"
  | "pour"
  | "purge"
  | "cloth"
  | "footstep"
  | "distribute"
  | "paper";
class CafeAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private sfx?: GainNode;
  private ambience?: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private chord = 0;
  private closing = false;
  private machineSource?: AudioBufferSourceNode;
  private machineGain?: GainNode;
  private motor?: OscillatorNode;
  private paused = false;
  settings = { master: 0.65, music: 0.3, sfx: 0.6 };
  async start() {
    if (this.context) {
      await this.context.resume();
      return;
    }
    const ctx = new AudioContext();
    this.context = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.connect(this.master);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);
    this.ambience = ctx.createGain();
    this.ambience.gain.value = 0.11;
    this.ambience.connect(this.master);
    this.apply();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const rain = ctx.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3600;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 650;
    rain.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(this.ambience);
    rain.start();
    this.playChord();
    this.timer = setInterval(() => this.playChord(), 7000);
    await ctx.resume();
  }
  update(settings: { master: number; music: number; sfx: number }) {
    this.settings = settings;
    this.apply();
  }
  private apply() {
    if (!this.context) return;
    this.master?.gain.setTargetAtTime(
      this.settings.master,
      this.context.currentTime,
      0.12,
    );
    this.music?.gain.setTargetAtTime(
      this.settings.music * (this.closing ? 0.45 : 1),
      this.context.currentTime,
      0.2,
    );
    this.sfx?.gain.setTargetAtTime(
      this.settings.sfx,
      this.context.currentTime,
      0.1,
    );
  }
  setRain(heavy: boolean) {
    if (this.context)
      this.ambience?.gain.setTargetAtTime(
        heavy ? 0.19 : 0.11,
        this.context.currentTime,
        1,
      );
  }
  setClosing(closing: boolean) {
    this.closing = closing;
    this.apply();
  }
  private tone(
    frequency: number,
    delay: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    music = false,
  ) {
    const ctx = this.context;
    const target = music ? this.music : this.sfx;
    if (!ctx || !target) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const at = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(target);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.1);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  private playChord() {
    const chords = [
      [130.81, 164.81, 196, 246.94],
      [110, 130.81, 164.81, 196],
      [87.31, 130.81, 164.81, 220],
      [98, 146.83, 174.61, 220],
    ];
    const frequencies = chords[this.chord++ % chords.length];
    frequencies.forEach((f, i) =>
      this.tone(f, 0.12 * i, 6.8, 0.025, "sine", true),
    );
    this.tone(frequencies[2] * 2, 1.6, 2, 0.013, "triangle", true);
  }
  private noise(duration: number, frequency: number, volume: number) {
    const ctx = this.context;
    if (!ctx || !this.sfx) return;
    const source = ctx.createBufferSource();
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    source.start();
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  machine(kind: "grinder" | "pump" | "steam") {
    this.stopMachines();
    const ctx = this.context;
    if (!ctx || !this.sfx) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] =
        (Math.random() * 2 - 1) *
        (0.72 +
          Math.sin((i / ctx.sampleRate) * (kind === "grinder" ? 150 : 55)) *
            0.28);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value =
      kind === "steam" ? 3100 : kind === "grinder" ? 720 : 180;
    filter.Q.value = 0.65;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      this.paused ? 0 : 0.16,
      ctx.currentTime + 0.12,
    );
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    source.start();
    const motor = ctx.createOscillator();
    motor.type = "triangle";
    motor.frequency.value = kind === "grinder" ? 115 : kind === "pump" ? 56 : 0;
    const motorGain = ctx.createGain();
    motorGain.gain.value = kind === "steam" ? 0 : 0.22;
    motor.connect(motorGain);
    motorGain.connect(gain);
    motor.start();
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      motor.disconnect();
      motorGain.disconnect();
    };
    this.machineSource = source;
    this.machineGain = gain;
    this.motor = motor;
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    if (this.context)
      this.machineGain?.gain.setTargetAtTime(
        paused ? 0 : 0.16,
        this.context.currentTime,
        0.04,
      );
  }
  stopMachines() {
    const ctx = this.context;
    if (ctx && this.machineSource) {
      this.machineGain?.gain.setTargetAtTime(0, ctx.currentTime, 0.018);
      this.machineSource.stop(ctx.currentTime + 0.08);
      this.motor?.stop(ctx.currentTime + 0.08);
    }
    this.machineSource = undefined;
    this.machineGain = undefined;
    this.motor = undefined;
  }
  play(sound: Sound | Foley) {
    if (!this.context) return;
    const foley: Partial<Record<Sound | Foley, [number, number, number]>> = {
      tamp: [0.12, 140, 0.22],
      latch: [0.17, 780, 0.13],
      pour: [1.2, 1100, 0.1],
      purge: [0.65, 3300, 0.14],
      cloth: [0.8, 900, 0.15],
      footstep: [0.1, 180, 0.09],
      distribute: [0.4, 1100, 0.08],
      paper: [0.3, 1400, 0.1],
    };
    if (foley[sound]) {
      this.noise(...foley[sound]!);
      if (sound === "tamp" || sound === "footstep")
        this.tone(sound === "tamp" ? 120 : 85, 0, 0.13, 0.055, "triangle");
      if (sound === "latch") {
        this.tone(860, 0, 0.16, 0.035);
        this.tone(550, 0.075, 0.1, 0.04);
      }
      return;
    }
    if (sound === "door") {
      this.noise(0.2, 650, 0.06);
      this.tone(1174, 0, 1.4, 0.045);
      this.tone(1568, 0.11, 1.8, 0.025);
      return;
    }
    if (sound === "payment") {
      this.noise(0.16, 550, 0.13);
      [2400, 1900, 2900].forEach((f, i) =>
        this.tone(f, 0.18 + i * 0.08, 0.18, 0.025),
      );
    }
    if (sound === "brew" || sound === "steam") {
      const ctx = this.context;
      const n = ctx.createBufferSource();
      const duration = sound === "brew" ? 4.8 : 1.6;
      const b = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = b.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * 0.12;
      n.buffer = b;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = sound === "brew" ? 160 : 2400;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);
      n.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfx!);
      n.start();
      n.onended = () => {
        n.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      if (sound === "brew") this.tone(65, 0, 4.7, 0.03, "triangle");
      return;
    }
    const notes: Record<Exclude<Sound, "brew" | "steam">, number[]> = {
      click: [480],
      cup: [1400, 900],
      bell: [880, 1318],
      payment: [523, 659, 784],
      ready: [659, 880, 1046],
      robot: [740, 554, 880],
      upgrade: [392, 523, 659, 784],
    };
    notes[sound as keyof typeof notes].forEach((f, i) =>
      this.tone(
        f,
        i * 0.09,
        sound === "bell" ? 1.5 : 0.35,
        sound === "cup" ? 0.045 : 0.06,
        "sine",
      ),
    );
  }
  dispose() {
    this.stopMachines();
    if (this.timer) clearInterval(this.timer);
    void this.context?.close();
  }
}
export const audio = new CafeAudio();
