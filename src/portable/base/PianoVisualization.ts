import Visualization from "./Visualization";

export interface State {
  // 88 booleans; true = pressed, false = released
  keys: boolean[];

  // unordered indexes of keys pressed since last frame
  newlyPressedKeys: ReadonlyArray<number>;

  // unordered indexes of keys released since last frame
  newlyReleasedKeys: ReadonlyArray<number>;
}

export default abstract class PianoVisualization extends Visualization<State> {
}
