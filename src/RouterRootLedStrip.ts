import * as Colors from "./portable/base/Colors";

import { SendableLedStrip } from "./SendableLedStrip";

export default class RouterRootLedStrip implements SendableLedStrip {
  public readonly size: number;
  private strips: SendableLedStrip[];

  constructor(size: number) {
    this.size = size;
    this.strips = [];
  }

  public setColor(index: number, color: Colors.Color) {
    this.strips.forEach(strip => strip.setColor(index, color));
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    this.strips.forEach(strip => strip.setRange(startIndex, numLeds, color));
  }

  public send() {
    this.strips.forEach(strip => strip.send());
  }

  public reset(color?: Colors.Color) {
    this.strips.forEach(strip => strip.reset(color));
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
