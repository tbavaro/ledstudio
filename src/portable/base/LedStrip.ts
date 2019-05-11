import * as Colors from "./Colors";

export default interface LedStrip {
  readonly size: number;

  // NB: n is allowed to be out-of-bounds, in which case it is a no-op
  setColor(index: number, color: Colors.Color): void;

  setRange(startIndex: number, numLeds: number, color: Colors.Color): void;

  reset(color?: Colors.Color): void;
}
