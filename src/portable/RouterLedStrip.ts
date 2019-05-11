import * as Colors from "./base/Colors";
import LedStrip from "./base/LedStrip";

export default class RouterLedStrip implements LedStrip {
  public readonly size: number;
  private strips: LedStrip[];

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

  public addStrip(strip: LedStrip) {
    if (!this.strips.includes(strip)) {
      this.strips.push(strip);
    }
  }

  public removeStrip(strip: LedStrip) {
    this.strips = this.strips.filter(s => s !== strip);
  }
}
