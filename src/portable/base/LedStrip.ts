import { Color } from "./Colors";

export default interface LedStrip {
  readonly size: number;
  setColor(n: number, color: Color): void;
  reset(color?: Color): void;
}
