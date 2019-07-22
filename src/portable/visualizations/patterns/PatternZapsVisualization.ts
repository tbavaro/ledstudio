import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const DECAY_RATE = 0.005; // per ms

export default class PatternZapsVisualization extends Visualization.RowColumnMappedVisualization {
  private phase: number = 0;
  private ribChannels: number[][];  // addressing is row -> column -> channel
  private channelValues: Map<number, Colors.Color>;
  private numRows: number;
  private numColumns: number;

  constructor(config: Visualization.Config) {
    super(config);

    this.ribChannels = [];
    this.channelValues = new Map();
    this.ledRowMetadatas.forEach((rowLeds, rowIndex) => {
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

  public renderRows(context: Visualization.FrameContext): void {
    const { elapsedMillis, beatController } = context;

    // decay
    const decayAmount = elapsedMillis * DECAY_RATE;
    this.channelValues.forEach((value, channel) => {
      this.channelValues.set(channel, Colors.multiply(value, 1 - decayAmount));
    });

    // do new zaps if needed
    this.phase += elapsedMillis;
    const millisBetweenZaps = 1 / beatController.hz() * 1000;
    while (this.phase > millisBetweenZaps) {
      this.doZap();
      this.phase -= millisBetweenZaps;
    }

    // render
    this.ledRowMetadatas.forEach((rowLeds, rowIndex) => {
      const ledRow = this.ledRows.get(rowIndex);
      rowLeds.forEach((ledMetadata, index) => {
        ledRow.set(index, this.channelValues.get(ledMetadata.hardwareChannel) || Colors.BLACK);
      });
    });
  }
}
