import * as Colors from "./portable/base/Colors";

import { ColorRow } from "./portable/base/PianoVisualization";
import { SendableLedStrip } from "./portable/SendableLedStrip";

export default class RootLeds {
  public readonly size: number;
  private strips: SendableLedStrip[];
  public readonly leds: ColorRow;

  constructor(size: number) {
    this.size = size;
    this.leds = new Array(size).fill(Colors.BLACK);
    this.strips = [];
  }

  public send() {
    this.strips.forEach(strip => {
      this.leds.forEach((color, i) => strip.setColor(i, color));
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
