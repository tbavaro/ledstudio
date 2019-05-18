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

  public copyWithDerez(from: ColorRow, derezAmount: number) {
    if (this.length !== from.length) {
      throw new Error("expected 'this' to be a the same length as 'from'");
    }

    for (let i = 0; i < from.length; ++i) {
      if (Math.random() > derezAmount) {
        this.set(i, from.get(i));
      }
    }
  }
}
