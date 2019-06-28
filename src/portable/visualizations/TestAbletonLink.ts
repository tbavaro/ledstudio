import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

export default class TestAbletonLink extends Visualization.default {
  private readonly duringBeatTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly progressToNextBeatTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly timeSinceLastBeatTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);
    this.duringBeatTimeSeries = config.createTimeSeries();
    this.timeSinceLastBeatTimeSeries = config.createTimeSeries();
    this.progressToNextBeatTimeSeries = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { beatController } = context;

    const duringBeat = beatController.timeSinceLastBeat() < 0.1 && (beatController.beatsSinceSync() % 4 === 0);

    this.ledRows.forEach(row => {
      row.fill(duringBeat ? Colors.WHITE : Colors.BLACK);
    });

    this.duringBeatTimeSeries.set(duringBeat ? 1 : 0);
    this.progressToNextBeatTimeSeries.set(beatController.progressToNextBeat());
    this.timeSinceLastBeatTimeSeries.set(beatController.timeSinceLastBeat());
  }
}
