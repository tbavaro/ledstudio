import Visualization from "./Visualization";

export interface State {
  // 88 booleans; true = pressed, false = released
  keys: boolean[];

  // sorted indexes of keys changed since last frame
  changedKeys: ReadonlyArray<number>;
}

export default abstract class PianoVisualization extends Visualization<State> {
}
