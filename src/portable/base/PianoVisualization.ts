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
  public readonly leds: ColorRow;

  constructor(numLeds: number) {
    this.leds = new ColorRow(numLeds);
  }

  public abstract render(elapsedMillis: number, state: State): void;
}
