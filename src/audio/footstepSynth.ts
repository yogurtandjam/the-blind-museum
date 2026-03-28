export class FootstepSynth {
  private ctx: AudioContext;
  private destination: AudioNode;
  private walkingTimers: number[] = [];

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  /** Short noise burst — simulates a footstep on marble */
  playFootstep() {
    const now = this.ctx.currentTime;

    // Impact layer — short, punchy noise
    const impactDuration = 0.12;
    const impactSize = Math.ceil(this.ctx.sampleRate * impactDuration);
    const impactBuffer = this.ctx.createBuffer(1, impactSize, this.ctx.sampleRate);
    const impactData = impactBuffer.getChannelData(0);
    for (let i = 0; i < impactSize; i++) {
      impactData[i] = (Math.random() * 2 - 1);
    }

    const impactSource = this.ctx.createBufferSource();
    impactSource.buffer = impactBuffer;

    const impactFilter = this.ctx.createBiquadFilter();
    impactFilter.type = "lowpass";
    impactFilter.frequency.value = 800 + Math.random() * 600;

    const impactGain = this.ctx.createGain();
    impactGain.gain.setValueAtTime(0.5 + Math.random() * 0.2, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + impactDuration);

    impactSource.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(this.destination);

    impactSource.start(now);
    impactSource.stop(now + impactDuration);

    // Click layer — adds a sharper transient
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = "square";
    clickOsc.frequency.setValueAtTime(150 + Math.random() * 100, now);
    clickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  }

  /** Play a sequence of footsteps over a duration */
  playWalkingSequence(durationMs = 1200) {
    this.stopWalking();
    const stepCount = 4 + Math.floor(Math.random() * 2);
    const interval = durationMs / stepCount;

    for (let i = 0; i < stepCount; i++) {
      const timer = window.setTimeout(() => {
        this.playFootstep();
      }, i * interval + Math.random() * 40);
      this.walkingTimers.push(timer);
    }
  }

  stopWalking() {
    this.walkingTimers.forEach((t) => clearTimeout(t));
    this.walkingTimers = [];
  }

  /** Longer sweep — entering a new room */
  playDoorTransition() {
    const now = this.ctx.currentTime;
    const duration = 0.6;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.4, now + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.destination);

    osc.start(now);
    osc.stop(now + duration);

    // Creak layer
    const creak = this.ctx.createOscillator();
    creak.type = "sawtooth";
    creak.frequency.setValueAtTime(400, now + 0.05);
    creak.frequency.exponentialRampToValueAtTime(200, now + duration * 0.5);

    const creakGain = this.ctx.createGain();
    creakGain.gain.setValueAtTime(0, now);
    creakGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

    const creakFilter = this.ctx.createBiquadFilter();
    creakFilter.type = "bandpass";
    creakFilter.frequency.value = 350;
    creakFilter.Q.value = 3;

    creak.connect(creakFilter);
    creakFilter.connect(creakGain);
    creakGain.connect(this.destination);

    creak.start(now);
    creak.stop(now + duration);
  }
}
