import * as Colors from "../portable/base/Colors";
import FixedArray from "../portable/base/FixedArray";
import LedMetadata from "../portable/base/LedMetadata";
import { MovingAverageHelper } from "../util/Utils";
import FadecandyClient from "./FadecandyClient";

const HEADER_LENGTH = 4;

export default class FadecandyLedSender {
  private readonly client: FadecandyClient;
  private readonly timingHelper: MovingAverageHelper = new MovingAverageHelper(
    20
  );
  private readonly channelToBufferMap: Map<number, Buffer>;
  private readonly leds: LedMetadata[];

  constructor(client: FadecandyClient, leds: LedMetadata[]) {
    this.client = client;
    this.leds = leds;

    const channelToIndicesMap = new Map<number, number[]>();
    leds.forEach(led => {
      let indices = channelToIndicesMap.get(led.hardwareChannel);
      if (indices === undefined) {
        indices = [];
        channelToIndicesMap.set(led.hardwareChannel, indices);
      }
      indices.push(led.hardwareIndex);
    });

    this.channelToBufferMap = new Map();
    const channelToLedCountMap = new Map<number, number>();
    channelToIndicesMap.forEach((indices: number[], channel: number) => {
      // validate
      indices.sort((a, b) => a - b);
      indices.forEach((idx, i) => {
        if (idx < i) {
          throw new Error(`channel ${channel} has duplicate index ${i}`);
        } else if (idx > i) {
          throw new Error(`channel ${channel} skipped index before ${i}`);
        }
      });

      // initialize buffer
      const numLeds = indices.length;
      channelToLedCountMap.set(channel, numLeds);
      const buffer = new Buffer(HEADER_LENGTH + 3 * numLeds).fill(0);
      buffer.writeUInt8(channel, 0); // channel
      buffer.writeUInt8(0, 1); // command
      buffer.writeUInt16BE(0, 2); // length is supposed to be 0 over websocket

      this.channelToBufferMap.set(channel, buffer);
    });
  }

  public send(colorRow: FixedArray<Colors.Color>) {
    this.timingHelper.addTiming(() => {
      // update buffers with these colors
      const ledRow = this.leds;
      if (colorRow.length !== ledRow.length) {
        throw new Error("colorRow length doesn't match led row length");
      }

      colorRow.forEach((color, i) => {
        const led = ledRow[i];
        const buffer = this.channelToBufferMap.get(led.hardwareChannel);
        if (buffer === undefined) {
          throw new Error("couldn't find buffer for channel");
        }

        const [r, g, b] = Colors.splitRGB(color);
        const offset = HEADER_LENGTH + led.hardwareIndex * 3;
        buffer.writeUInt8(r, offset);
        buffer.writeUInt8(g, offset + 1);
        buffer.writeUInt8(b, offset + 2);
      });
    });

    // send the buffers
    this.channelToBufferMap.forEach(buffer => {
      this.client.sendData(buffer);
    });
  }

  public get averageSendTime() {
    return this.timingHelper.movingAverage;
  }
}
