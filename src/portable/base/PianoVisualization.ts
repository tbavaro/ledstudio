import ColorRow from "./ColorRow";

export interface State {
  // 88 booleans; true = pressed, false = released
  keys: boolean[];

  // velocity (0-1) of most recent key event (press OR release)
  keyVelocities: number[];

  // sorted indexes of keys changed since last frame
  changedKeys: ReadonlyArray<number>;
}

export default abstract class PianoVisualization {
  protected readonly leds: ColorRow;

  constructor(leds: ColorRow) {
    this.leds = leds;
  }

  public abstract render(elapsedMillis: number, state: State): void;
}
