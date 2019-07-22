import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

export default class TestAbletonLink extends Visualization.RowColumnMappedVisualization {
  private readonly duringBeatTimeSeries: Visualization.TimeSeriesValue;
  private readonly progressToNextBeatTimeSeries: Visualization.TimeSeriesValue;
  private readonly timeSinceLastBeatTimeSeries: Visualization.TimeSeriesValue;

  constructor(config: Visualization.Config) {
    super(config);
    this.duringBeatTimeSeries = config.createTimeSeries();
    this.timeSinceLastBeatTimeSeries = config.createTimeSeries();
    this.progressToNextBeatTimeSeries = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { beatController } = context;

    const duringBeat = beatController.timeSinceLastBeat() < 0.1 && (beatController.beatNumber() % 4 === 0);

    this.ledRows.forEach(row => {
      row.fill(duringBeat ? Colors.WHITE : Colors.BLACK);
    });

    this.duringBeatTimeSeries.value = duringBeat ? 1 : 0;
    this.progressToNextBeatTimeSeries.value = beatController.progressToNextBeat();
    this.timeSinceLastBeatTimeSeries.value = beatController.timeSinceLastBeat();
  }
}
