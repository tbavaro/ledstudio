import * as Colors from "./Colors";

export default interface LedStrip {
  readonly size: number;

  // NB: n is allowed to be out-of-bounds, in which case it is a no-op
  setColor(index: number, color: Colors.Color): void;

  setRange(startIndex: number, numLeds: number, color: Colors.Color): void;

  reset(color?: Colors.Color): void;
}

// represents a subset of an LedStrip as its own LedStrip
export class PartialLedStrip implements LedStrip {
  private readonly delegateStrip: LedStrip;
  private readonly indexOffset: number;
  public readonly size: number;

  constructor(delegateStrip: LedStrip, indexOffset: number, numLeds: number) {
    this.delegateStrip = delegateStrip;
    this.indexOffset = indexOffset;
    this.size = numLeds;
  }

  public setColor(n: number, color: Colors.Color) {
    if (n >= 0 && n < this.size) {
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
