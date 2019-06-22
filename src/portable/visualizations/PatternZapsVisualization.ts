import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const MILLIS_BETWEEN_ZAPS = 300;
const DECAY_RATE = 0.005; // per ms

export default class PatternZapsVisualization extends Visualization.default {
  private phase: number = 0;
  private ribChannels: number[][];  // addressing is row -> column -> channel
  private channelValues: Map<number, Colors.Color>;
  private numRows: number;
  private numColumns: number;

  constructor(scene: Scene) {
    super(scene);

    this.ribChannels = [];
    this.channelValues = new Map();
    scene.leds.forEach((rowLeds, rowIndex) => {
      const rowChannels: number[] = [];
      rowLeds.forEach(led => {
        const channel = led.hardwareChannel;
        if (!rowChannels.includes(channel)) {
          rowChannels.push(channel);
          this.channelValues.set(channel, 0);
        }
      });
      this.ribChannels.push(rowChannels);
    });

    this.numRows = this.ribChannels.length;
    if (this.numRows === 0) {
      throw new Error("no rows");
    }
    this.numColumns = this.ribChannels[0].length;
    this.ribChannels.forEach(rowChannels => {
      const myNumColumns = rowChannels.length;
      if (this.numColumns !== myNumColumns) {
        throw new Error("rows don't all have the same number of columns!");
      }
    });
  }

  private doZap() {
    const leftRow = Math.floor(Math.random() * this.numRows);
    const rightRow = Math.floor(Math.random() * this.numRows);
    const color = Colors.hsv(Math.random() * 360, 0.6, 1);

    for (let column = 0; column < this.numColumns; ++column) {
      const row = (column < (this.numColumns / 2) ? leftRow : rightRow);
      const channel = this.ribChannels[row][column];
      this.channelValues.set(channel, Colors.add(this.channelValues.get(channel) || Colors.BLACK, color));
    }
  }

  public render(elapsedMillis: number, state: Visualization.State, context: Visualization.Context): void {
    // decay
    const decayAmount = elapsedMillis * DECAY_RATE;
    this.channelValues.forEach((value, channel) => {
      this.channelValues.set(channel, Colors.multiply(value, 1 - decayAmount));
    });

    // do new zaps if needed
    this.phase += elapsedMillis;
    while (this.phase > MILLIS_BETWEEN_ZAPS) {
      this.doZap();
      this.phase -= MILLIS_BETWEEN_ZAPS;
    }

    // render
    this.scene.leds.forEach((rowLeds, rowIndex) => {
      const ledRow = this.ledRows.get(rowIndex);
      rowLeds.forEach((ledInfo, index) => {
        ledRow.set(index, this.channelValues.get(ledInfo.hardwareChannel) || Colors.BLACK);
      });
    });
  }
}