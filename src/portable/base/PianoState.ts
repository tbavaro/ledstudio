const NUM_KEYS = 88;

export default class PianoState {
  // 88 booleans; true = pressed, false = released
  public keys: boolean[];

  // velocity (0-1) of most recent key event (press OR release)
  public keyVelocities: number[];

  // sorted indexes of keys changed since last frame
  public changedKeys: number[];

  public constructor() {
    this.keys = new Array<boolean>(NUM_KEYS).fill(false);
    this.keyVelocities = new Array<number>(NUM_KEYS).fill(0);
    this.changedKeys = [];
  }

  public reset() {
    this.keys.fill(false);
    this.keyVelocities.fill(0);
    this.changedKeys = [];
  }
}
