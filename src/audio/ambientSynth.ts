/**
 * Procedural ambient sound generator.
 * Each department gets a unique sonic texture built from
 * oscillators, filtered noise, and subtle modulation.
 */

type AmbientProfile = {
  baseFreq: number;
  filterFreq: number;
  filterQ: number;
  oscType: OscillatorType;
  noiseGain: number;
  oscGain: number;
  modulationRate: number;
};

// Sonic profiles per department — each evokes a different gallery space
const DEPARTMENT_PROFILES: Record<number, AmbientProfile> = {
  1: { baseFreq: 55, filterFreq: 300, filterQ: 2, oscType: "sine", noiseGain: 0.03, oscGain: 0.02, modulationRate: 0.1 },        // American Decorative Arts
  3: { baseFreq: 65, filterFreq: 250, filterQ: 3, oscType: "sine", noiseGain: 0.04, oscGain: 0.015, modulationRate: 0.08 },      // Ancient Near Eastern Art
  4: { baseFreq: 50, filterFreq: 400, filterQ: 1.5, oscType: "triangle", noiseGain: 0.02, oscGain: 0.025, modulationRate: 0.15 }, // Arms and Armor
  5: { baseFreq: 80, filterFreq: 600, filterQ: 1, oscType: "sine", noiseGain: 0.02, oscGain: 0.02, modulationRate: 0.2 },        // Arts of Africa, Oceania
  6: { baseFreq: 70, filterFreq: 500, filterQ: 2, oscType: "sine", noiseGain: 0.025, oscGain: 0.02, modulationRate: 0.12 },      // Asian Art
  7: { baseFreq: 60, filterFreq: 350, filterQ: 2.5, oscType: "sine", noiseGain: 0.035, oscGain: 0.015, modulationRate: 0.07 },   // The Cloisters
  8: { baseFreq: 45, filterFreq: 280, filterQ: 3, oscType: "sine", noiseGain: 0.04, oscGain: 0.01, modulationRate: 0.06 },       // Costumes
  9: { baseFreq: 75, filterFreq: 200, filterQ: 4, oscType: "sine", noiseGain: 0.03, oscGain: 0.02, modulationRate: 0.05 },       // Drawings and Prints
  10: { baseFreq: 40, filterFreq: 180, filterQ: 5, oscType: "sine", noiseGain: 0.05, oscGain: 0.01, modulationRate: 0.04 },      // Egyptian Art
  11: { baseFreq: 55, filterFreq: 450, filterQ: 1.5, oscType: "sine", noiseGain: 0.02, oscGain: 0.025, modulationRate: 0.18 },   // European Paintings
  12: { baseFreq: 60, filterFreq: 380, filterQ: 2, oscType: "triangle", noiseGain: 0.025, oscGain: 0.02, modulationRate: 0.14 }, // European Sculpture
  13: { baseFreq: 50, filterFreq: 320, filterQ: 2, oscType: "sine", noiseGain: 0.03, oscGain: 0.02, modulationRate: 0.1 },       // Greek and Roman Art
  14: { baseFreq: 85, filterFreq: 550, filterQ: 1, oscType: "sine", noiseGain: 0.015, oscGain: 0.025, modulationRate: 0.22 },    // Islamic Art
  15: { baseFreq: 90, filterFreq: 700, filterQ: 0.8, oscType: "sine", noiseGain: 0.02, oscGain: 0.02, modulationRate: 0.25 },    // Robert Lehman Collection
  16: { baseFreq: 48, filterFreq: 260, filterQ: 3, oscType: "sine", noiseGain: 0.035, oscGain: 0.015, modulationRate: 0.09 },    // Medieval Art
  17: { baseFreq: 100, filterFreq: 800, filterQ: 0.7, oscType: "sine", noiseGain: 0.015, oscGain: 0.025, modulationRate: 0.3 },  // Musical Instruments
  19: { baseFreq: 72, filterFreq: 480, filterQ: 1.5, oscType: "sine", noiseGain: 0.02, oscGain: 0.02, modulationRate: 0.16 },    // Photographs
  21: { baseFreq: 65, filterFreq: 420, filterQ: 2, oscType: "sine", noiseGain: 0.025, oscGain: 0.02, modulationRate: 0.13 },     // Modern Art
};

const DEFAULT_PROFILE: AmbientProfile = {
  baseFreq: 60, filterFreq: 350, filterQ: 2, oscType: "sine",
  noiseGain: 0.03, oscGain: 0.02, modulationRate: 0.1,
};

export class AmbientSynth {
  private ctx: AudioContext;
  private destination: AudioNode;
  private masterGain: GainNode;
  private activeNodes: AudioNode[] = [];
  private currentDepartmentId: number | null = null;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(destination);
  }

  private getProfile(departmentId: number): AmbientProfile {
    return DEPARTMENT_PROFILES[departmentId] || DEFAULT_PROFILE;
  }

  private createNoiseBuffer(durationSec: number): AudioBuffer {
    const length = Math.ceil(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private stopActive() {
    this.activeNodes.forEach((node) => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeNodes = [];
  }

  private startAmbient(departmentId: number) {
    const profile = this.getProfile(departmentId);

    // Filtered noise layer
    const noiseBuffer = this.createNoiseBuffer(4);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = profile.filterFreq;
    noiseFilter.Q.value = profile.filterQ;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = profile.noiseGain;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Oscillator layer — very low drone
    const osc = this.ctx.createOscillator();
    osc.type = profile.oscType;
    osc.frequency.value = profile.baseFreq;

    const oscGain = this.ctx.createGain();
    oscGain.gain.value = profile.oscGain;

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    // Subtle LFO modulation on the filter frequency
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = profile.modulationRate;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = profile.filterFreq * 0.15;

    lfo.connect(lfoGain);
    lfoGain.connect(noiseFilter.frequency);

    noiseSource.start();
    osc.start();
    lfo.start();

    this.activeNodes.push(noiseSource, noiseFilter, noiseGain, osc, oscGain, lfo, lfoGain);
  }

  crossfadeTo(departmentId: number, durationMs = 2000) {
    if (departmentId === this.currentDepartmentId) return;

    const now = this.ctx.currentTime;
    const fadeDuration = durationMs / 1000;

    // Fade out current
    this.masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration / 2);

    setTimeout(() => {
      this.stopActive();
      this.startAmbient(departmentId);
      this.masterGain.gain.linearRampToValueAtTime(
        1,
        this.ctx.currentTime + fadeDuration / 2
      );
    }, (durationMs / 2));

    this.currentDepartmentId = departmentId;
  }

  stop() {
    const now = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
    setTimeout(() => this.stopActive(), 500);
    this.currentDepartmentId = null;
  }
}
