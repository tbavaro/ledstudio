import * as Visualization from "../../base/Visualization";

const GROUP_NAME = "tests";
const NAME = "testTimeseriesData";

class TestTimeseriesDataVisualization extends Visualization.default {
  private phase = 0;

  private readonly aTimeSeries: Visualization.TimeSeriesValue;
  private readonly bTimeSeries: Visualization.TimeSeriesValue;
  private readonly cTimeSeries: Visualization.TimeSeriesValue;

  constructor(config: Visualization.Config) {
    super(config);
    this.aTimeSeries = config.createTimeSeries();
    this.bTimeSeries = config.createTimeSeries();
    this.cTimeSeries = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    this.phase = (this.phase + elapsedMillis / 1000) % (Math.PI * 2);

    this.aTimeSeries.value = (Math.sin(this.phase) + 1) / 2;
    this.bTimeSeries.value = (Math.cos(this.phase * 5) + 1) / 2;
    this.cTimeSeries.value = ((this.phase * 10) % (Math.PI * 2) < Math.PI) ? 0.5 : NaN;
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: TestTimeseriesDataVisualization });
export default factory;
