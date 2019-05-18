import ColorRow from "./portable/base/ColorRow";
import { SendableLedStrip } from "./portable/SendableLedStrip";

export default class RootLeds {
  public readonly size: number;
  private strips: SendableLedStrip[];
  private colorRow?: ColorRow;

  constructor(size: number) {
    this.size = size;
    this.strips = [];
  }

  public setColorRow(colorRow: ColorRow) {
    this.colorRow = colorRow;
  }

  public send() {
    const colorRow = this.colorRow;
    if (!colorRow) {
      throw new Error("colorRow not set");
    }
    this.strips.forEach(strip => {
      colorRow.forEach((color, i) => strip.setColor(i, color));
      strip.send();
    });
  }

  public addStrip(strip: SendableLedStrip) {
    if (!this.strips.includes(strip)) {
      if (strip.size > this.size) {
        throw new Error("adding bigger LedStrip into smaller RouterLedStrip");
      }
      this.strips.push(strip);
    }
  }

  public removeStrip(strip: SendableLedStrip) {
    this.strips = this.strips.filter(s => s !== strip);
  }
}
