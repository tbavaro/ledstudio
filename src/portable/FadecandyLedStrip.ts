import * as Colors from "./base/Colors";
import LedStrip from "./base/LedStrip";

import { PartialLedStrip } from "./CompositeLedStrips";
import FadecandyClient from "./FadecandyClient";
import { ensureValidRange } from "./Utils";

const HEADER_LENGTH = 4;

class FadecandyLedSingleStrip implements LedStrip {
  public readonly size: number;

  private readonly client: FadecandyClient;
  private readonly buffer: Buffer;

  constructor(client: FadecandyClient, channel: number, size: number) {
    if (size <= 0 || size > 64) {
      throw new Error(`invalid size: ${size}`);
    }

    this.client = client;
    this.size = size;

    const colorDataLength = size * 3;
    this.buffer = new Buffer(HEADER_LENGTH + colorDataLength);

    // header
    this.buffer.writeUInt8(0, channel); // channel
    this.buffer.writeUInt8(0, 1); // command
    this.buffer.writeUInt16BE(colorDataLength, 2); // length

    this.reset();
  }

  public send() {
    this.client.sendData(this.buffer);
  }

  public setColor(index: number, color: Colors.Color) {
    if (index >= 0 && index < this.size) {
      let offset = HEADER_LENGTH + index * 3;
      const [r, g, b] = Colors.splitRGB(color);
      this.buffer.writeUInt8(r, offset++);
      this.buffer.writeUInt8(g, offset++);
      this.buffer.writeUInt8(b, offset);
    }
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    [startIndex, numLeds] = ensureValidRange(startIndex, numLeds, this.size);
    if (numLeds > 0) {
      const [r, g, b] = Colors.splitRGB(color);
      let offset = HEADER_LENGTH + startIndex * 3;
      for (let i = 0; i < numLeds; ++i) {
        this.buffer.writeUInt8(r, offset++);
        this.buffer.writeUInt8(g, offset++);
        this.buffer.writeUInt8(b, offset++);
      }
    }
  }

  public reset(color?: Colors.Color) {
    this.setRange(0, this.size, color || Colors.BLACK);
  }
}

// hack for now to show it on just part of it
const HACK_OFFSET = -88;
const HACK_LENGTH = 88 * 3;

export default class FadecandyLedStrip implements LedStrip {
  public readonly size: number;

  private readonly part: FadecandyLedSingleStrip;
  private readonly delegate: LedStrip;

  constructor(client: FadecandyClient) {
    this.size = 88 * 3;
    this.part = new FadecandyLedSingleStrip(client, 0, 64);
    this.delegate = new PartialLedStrip(this.part, HACK_OFFSET, HACK_LENGTH, /*reverse=*/true);
  }

  public setColor(index: number, color: Colors.Color) {
    this.delegate.setColor(index, color);
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    this.delegate.setRange(startIndex, numLeds, color);
  }

  public reset(color?: Colors.Color) {
    this.delegate.reset(color);
  }

  public send() {
    this.part.send();
  }
}
