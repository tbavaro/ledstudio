import ColorRow from "./portable/base/ColorRow";
import { SendableLedStrip } from "./portable/SendableLedStrip";

export default class RootLeds {
  private strips: SendableLedStrip[];
  private colorRow?: ColorRow;

  constructor() {
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
      this.strips.push(strip);
    }
  }

  public removeStrip(strip: SendableLedStrip) {
    this.strips = this.strips.filter(s => s !== strip);
  }
}
