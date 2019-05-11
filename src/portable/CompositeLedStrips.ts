import * as Colors from "./base/Colors";
import LedStrip from "./base/LedStrip";
import { ensureValidRange } from "./Utils";

// represents a subset of an LedStrip as its own LedStrip
export class PartialLedStrip implements LedStrip {
  private readonly delegateStrip: LedStrip;
  private readonly indexOffset: number;
  private readonly reverse: boolean;
  public readonly size: number;

  constructor(delegateStrip: LedStrip, indexOffset: number, numLeds: number, reverse?: boolean) {
    this.delegateStrip = delegateStrip;
    this.indexOffset = indexOffset;
    this.size = numLeds;
    this.reverse = reverse || false;
  }

  public setColor(n: number, color: Colors.Color) {
    if (n >= 0 && n < this.size) {
      if (this.reverse) {
        n = this.size - 1 - n;
      }
      this.delegateStrip.setColor(this.indexOffset + n, color);
    }
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    [startIndex, numLeds] = ensureValidRange(startIndex, numLeds, this.size);
    if (numLeds > 0) {
      this.delegateStrip.setRange(this.indexOffset + startIndex, numLeds, color);
    }
  }

  public reset(color?: Colors.Color) {
    this.setRange(0, this.size, color || Colors.BLACK);
  }

  public send() {
    this.delegateStrip.send();
  }
}

// displays the same thing across multiple LedStrips
export class MultipleLedStrip implements LedStrip {
  private readonly delegateStrips: LedStrip[];
  public readonly size: number;

  constructor(delegateStrips: LedStrip[]) {
    this.delegateStrips = [...delegateStrips];
    this.size = delegateStrips.reduce((prevMax, strip) => Math.max(prevMax, strip.size), 0);
  }

  public setColor(n: number, color: Colors.Color) {
    this.delegateStrips.forEach(strip => strip.setColor(n, color));
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    this.delegateStrips.forEach(strip => strip.setRange(startIndex, numLeds, color));
  }

  public reset(color?: Colors.Color) {
    this.delegateStrips.forEach(strip => strip.reset(color));
  }

  public send() {
    this.delegateStrips.forEach(strip => strip.send());
  }
}

export class ColorTransformLedStrip implements LedStrip {
  private readonly delegateStrip: LedStrip;
  private readonly transform: (color: Colors.Color) => Colors.Color;
  public readonly size: number;

  constructor(delegateStrip: LedStrip, transform: (color: Colors.Color) => Colors.Color) {
    this.size = delegateStrip.size;
    this.delegateStrip = delegateStrip;
    this.transform = transform;
  }

  public setColor(n: number, color: Colors.Color) {
    this.delegateStrip.setColor(n, this.transform(color));
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    this.delegateStrip.setRange(startIndex, numLeds, this.transform(color));
  }

  public reset(color?: Colors.Color) {
    color = this.transform(color || Colors.BLACK);
    this.delegateStrip.reset(color);
  }

  public send() {
    this.delegateStrip.send();
  }
}

// "Derez" means only update Leds some % of the time; makes it looks
// sparkly/dirty
// NB: you must call "apply" at the end of each render
export class DerezLedStrip implements LedStrip {
  public readonly size: number;
  private readonly delegateStrip: LedStrip;
  private readonly derezAmount: number;
  private readonly colors: Colors.Color[];

  constructor(delegateStrip: LedStrip, derezAmount: number) {
    this.size = delegateStrip.size;
    this.delegateStrip = delegateStrip;
    this.derezAmount = derezAmount;
    this.colors = new Array(this.size).fill(Colors.BLACK);
  }

  public setColor(n: number, color: Colors.Color) {
    if (n >= 0 && n < this.size) {
      this.colors[n] = color;
    }
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    [startIndex, numLeds] = ensureValidRange(startIndex, numLeds, this.size);
    if (numLeds > 0) {
      for (let n = startIndex; n < (startIndex + numLeds); ++n) {
        this.colors[n] = color;
      }
    }
  }

  // NB: this sets them immediately, ignoring derez effect
  public reset(color?: Colors.Color) {
    color = color || Colors.BLACK;
    this.setRange(0, this.size, color);
    this.delegateStrip.reset(color);
  }

  // TODO consider making this pay attention to elapsed time; otherwise
  // it behaves inconsistently at different FPS
  public apply() {
    for (let n = 0; n < this.colors.length; ++n) {
      if (Math.random() > this.derezAmount) {
        this.delegateStrip.setColor(n, this.colors[n]);
      }
    }
  }

  public send() {
    this.delegateStrip.send();
  }
}
