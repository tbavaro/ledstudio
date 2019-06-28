import BeatController from "./BeatController";

const DEFAULT_BPM = 120;

// used to figure out when two taps are close enough together
// to define a rate, vs being unrelated
const MIN_BPM = 40;

export default class ManualBeatController implements BeatController {
  private firstBeatStartTime: number = performance.now();
  private beatLengthMillis: number = 60000 / DEFAULT_BPM;
  private prevPressTime: number | null = null;
  private tapsInSequence: number = 0;

  public onTap() {
    const now = performance.now();
    if (this.prevPressTime !== null && now - this.prevPressTime < (60000 / MIN_BPM)) {
      this.tapsInSequence += 1;
      this.beatLengthMillis = now - this.prevPressTime;
      this.firstBeatStartTime = now - this.beatLengthMillis * (this.tapsInSequence - 1);
    } else {
      this.tapsInSequence = 1;
      this.firstBeatStartTime = now;
    }
    this.prevPressTime = now;
  }

  public hz(): number {
    return 1000 / this.beatLengthMillis;
  }

  public beatsSinceSync(): number {
    const now = performance.now();
    return Math.floor((now - this.firstBeatStartTime) / this.beatLengthMillis);
  }

  public timeSinceLastBeat(): number {
    const now = performance.now();
    return ((now - this.firstBeatStartTime) % this.beatLengthMillis) / 1000;
  }

  public progressToNextBeat(): number {
    return this.timeSinceLastBeat() / this.beatLengthMillis * 1000;
  }
}
