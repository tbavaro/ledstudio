import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const LED_SEPARATION = 3;
const SPEED = 10; // LEDs per second

export default class PatternMarqueeVisualization extends Visualization.RowColumnMappedVisualization {
  private readonly ledAddresses: Array<[number, number]>;
  private phase = 0;

  constructor(config: Visualization.Config) {
    super(config);
    this.ledAddresses = [];
    this.ledRowMetadatas[0].forEach((_, i) => this.ledAddresses.push([0, i]));
    const bottomRow = this.ledRowMetadatas.length - 1;
    const bottomRowCount = this.ledRowMetadatas[bottomRow].length;
    this.ledRowMetadatas[bottomRow].forEach((_, i) =>
      this.ledAddresses.push([bottomRow, bottomRowCount - i - 1])
    );
  }

  public renderRows(context: Visualization.FrameContext): void {
    const { elapsedSeconds } = context;
    this.phase = (this.phase + SPEED * elapsedSeconds) % LED_SEPARATION;
    const offset = Math.round(this.phase);
    this.ledAddresses.forEach((ledAddress, i) => {
      const [row, index] = ledAddress;
      const color =
        (i + offset) % LED_SEPARATION === 0 ? Colors.WHITE : Colors.BLACK;
      this.ledRows.get(row).set(index, color);
    });
  }
}
