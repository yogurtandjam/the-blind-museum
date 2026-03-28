export class SpatialMixer {
  private panner: StereoPannerNode;
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.panner = ctx.createStereoPanner();
    this.panner.connect(ctx.destination);
  }

  get output(): StereoPannerNode {
    return this.panner;
  }

  panTo(value: number, durationMs = 150) {
    const clamped = Math.max(-1, Math.min(1, value));
    this.panner.pan.linearRampToValueAtTime(
      clamped,
      this.ctx.currentTime + durationMs / 1000
    );
  }

  panLeft(amount = 0.4, durationMs = 150) {
    this.panTo(-amount, durationMs);
  }

  panRight(amount = 0.4, durationMs = 150) {
    this.panTo(amount, durationMs);
  }

  panCenter(durationMs = 300) {
    this.panTo(0, durationMs);
  }

  /** Brief directional pan that returns to center */
  nudge(direction: "left" | "right") {
    if (direction === "left") {
      this.panLeft();
    } else {
      this.panRight();
    }
    setTimeout(() => this.panCenter(), 200);
  }
}
