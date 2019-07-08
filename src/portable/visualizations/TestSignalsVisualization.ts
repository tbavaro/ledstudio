import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import { Signals } from "./util/SignalsHelper";

const NAME = "testSignals";

class MyVisualization extends Visualization.default {
  private readonly signals: Signals;

  private readonly isNewBeatTS: Visualization.TimeSeriesValue;
  private readonly isStrongBeatTS: Visualization.TimeSeriesValue;

  constructor(config: Visualization.Config) {
    super(config);

    this.isNewBeatTS = config.createTimeSeries({ color: Colors.RED });
    this.isStrongBeatTS = config.createTimeSeries({ color: Colors.PURPLE });

    this.signals = config.signals;
  }

  public render(context: Visualization.FrameContext): void {
    this.isNewBeatTS.value = this.signals.isNewBeat ? 0 : 1;
    this.isStrongBeatTS.value = this.signals.isStrongBeat ? 0 : 1;
  }
}

const factory = new Visualization.Factory(NAME, MyVisualization);
export default factory;
