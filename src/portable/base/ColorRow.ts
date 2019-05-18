import * as Colors from "./Colors";
import FixedArray from "./FixedArray";

export default class ColorRow extends FixedArray<Colors.Color> {
  private readonly defaultColor: Colors.Color;

  constructor(length: number, defaultColor?: Colors.Color) {
    const dc = defaultColor || Colors.BLACK;
    super(length, _ => dc);
    this.defaultColor = dc;
  }

  public get(i: number): Colors.Color {
    return this.getOr(i, this.defaultColor);
  }

  public add(i: number, color: Colors.Color) {
    this.set(i, Colors.add(this.get(i), color));
  }
}
