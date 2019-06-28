import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import AbletonLinkConnect from "./util/AbletonLinkConnect";
import BeatController from "./util/BeatController";

export default class TestAbletonLink extends Visualization.default {
  private readonly link: BeatController;
  private readonly duringBeatTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly progressToNextBeatTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly timeSinceLastBeatTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);
    this.link = new AbletonLinkConnect();
    this.duringBeatTimeSeries = config.createTimeSeries();
    this.timeSinceLastBeatTimeSeries = config.createTimeSeries();
    this.progressToNextBeatTimeSeries = config.createTimeSeries();
  }


  public render(context: Visualization.FrameContext): void {

    const duringBeat = this.link.timeSinceLastBeat() < 0.1 && (this.link.beatsSinceSync() % 4 === 0);

    this.ledRows.forEach(row => {
      row.fill(duringBeat ? Colors.WHITE : Colors.BLACK);
    });

    this.duringBeatTimeSeries.set(duringBeat ? 1 : 0);
    this.progressToNextBeatTimeSeries.set(this.link.progressToNextBeat());
    this.timeSinceLastBeatTimeSeries.set(this.link.timeSinceLastBeat());
  }
}
