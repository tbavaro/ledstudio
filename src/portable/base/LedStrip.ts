import * as Colors from "./Colors";
type Color = Colors.Color;

export default interface LedStrip {
  readonly size: number;
  setColor(n: number, color: Color): void;
  reset(color?: Color): void;
}

export class ArrayLedStrip implements LedStrip {
  public readonly size: number;
  public readonly colors: ReadonlyArray<Color>;
  private readonly internalColors: Color[];

  constructor(size: number) {
    this.size = size;
    this.internalColors = new Array(size);
    this.internalColors.fill(Colors.BLACK);
    this.colors = this.internalColors;
  }

  public setColor(n: number, color: Color) {
    if (n >= 0 && n < this.colors.length) {
      this.internalColors[n] = color;
    }
  }

  public reset(color?: Color): void {
    this.internalColors.fill(color || Colors.BLACK);
  }
}
