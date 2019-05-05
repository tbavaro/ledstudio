import * as Colors from "./base/Colors";
import LedStrip from "./base/LedStrip";

// represents a subset of an LedStrip as its own LedStrip
export class PartialLedStrip implements LedStrip {
  private readonly delegateStrip: LedStrip;
  private readonly indexOffset: number;
  private readonly reverse: boolean;
  public readonly size: number;

  constructor(delegateStrip: LedStrip, indexOffset: number, numLeds: number, reverse?: boolean) {
    console.log("instantiating", reverse);
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
    if (startIndex < 0) {
      numLeds += startIndex;
      startIndex = 0;
    }

    numLeds = Math.min(numLeds, this.size - startIndex);

    if (numLeds > 0) {
      this.delegateStrip.setRange(this.indexOffset + startIndex, numLeds, color);
    }
  }

  public reset(color?: Colors.Color) {
    this.setRange(0, this.size, color || Colors.BLACK);
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
    this.delegateStrips.forEach(strip => this.setRange(startIndex, numLeds, color));
  }

  public reset(color?: Colors.Color) {
    this.delegateStrips.forEach(strip => this.reset(color));
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
}
