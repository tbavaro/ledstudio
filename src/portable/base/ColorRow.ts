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

  public copy(source: ColorRow, options?: {
    derezAmount?: number;
    multiplyBy?: number
  }) {
    if (options === undefined) {
      options = {};
    }

    if (this.length !== source.length) {
      throw new Error("expected 'this' to be a the same length as 'from'");
    }

    for (let i = 0; i < source.length; ++i) {
      if (options.derezAmount === undefined || Math.random() > options.derezAmount) {
        let color = source.get(i);
        if (options.multiplyBy !== undefined) {
          color = Colors.multiply(color, options.multiplyBy);
        }
        this.set(i, color);
      }
    }
  }
}
