import * as Visualization from "../base/Visualization";

export default class TestTimeseriesDataVisualization extends Visualization.default {
  private phase = 0;

  private readonly aTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly bTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly cTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);
    this.aTimeSeries = config.createTimeSeries();
    this.bTimeSeries = config.createTimeSeries();
    this.cTimeSeries = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    this.phase = (this.phase + elapsedMillis / 1000) % (Math.PI * 2);

    this.aTimeSeries.set((Math.sin(this.phase) + 1) / 2);
    this.bTimeSeries.set((Math.cos(this.phase * 5) + 1) / 2);
    this.cTimeSeries.set(((this.phase * 10) % (Math.PI * 2) < Math.PI) ? 0.5 : null);
  }
}
