import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import BasicAudioHelper from "./util/BasicAudioHelper";

import { bracket01, valueOrDefault } from "../../util/Utils";
import FancyValue from "../base/FancyValue";
// import WindowStats from "../../util/WindowStats";
// import TimeSeriesBandHelper from "./util/TimeSeriesBandHelper";

const NAME = "test:levels";

class LevelsHelper {
  private readonly v: FancyValue = new FancyValue();
  private readonly decayRate: number;
  private readonly gain: number;
  private readonly threshold: number;

  constructor(attrs: {
    decayRate: number,
    gain?: number,
    threshold?: number
  }) {
    this.decayRate = attrs.decayRate;
    this.gain = valueOrDefault(attrs.gain, 1);
    this.threshold = valueOrDefault(attrs.threshold, 0);
  }

  public processValue(newValue: number, elapsedMillis: number) {
    const v = bracket01((newValue - this.threshold) / (1 - this.threshold) * this.gain);
    this.v.decayLinearRate(this.decayRate, elapsedMillis / 1000);
    this.v.bumpTo(v);
  }

  public get value() {
    return this.v.value;
  }
}

class MultiLevelHelper {
  private readonly audioHelper: BasicAudioHelper;
  private readonly lowHelper: LevelsHelper;
  private readonly highHelper: LevelsHelper;

  constructor(audioSource: AudioNode | null) {
    this.audioHelper = new BasicAudioHelper(audioSource);

    this.lowHelper = new LevelsHelper({
      decayRate: 1,
      gain: 2,
      threshold: 0.25
    });

    this.highHelper = new LevelsHelper({
      decayRate: 3,
      gain: 6,
      threshold: 0.075
    });
  }

  public sample(elapsedMillis: number) {
    const audioValues = this.audioHelper.getValues();
    this.lowHelper.processValue(audioValues.lowRMS, elapsedMillis);
    this.highHelper.processValue(audioValues.highRMS, elapsedMillis);
  }

  public get lowLevel() {
    return this.lowHelper.value;
  }

  public get highLevel() {
    return this.highHelper.value;
  }
}

class TestBandsVisualization extends Visualization.default {
  // private readonly valueTS: Visualization.TimeSeriesValue;

  private readonly lowTS: Visualization.TimeSeriesValue;
  private readonly highTS: Visualization.TimeSeriesValue;
  private readonly helper: MultiLevelHelper;
  // private readonly lowBand: TimeSeriesBandHelper;


  constructor(config: Visualization.Config) {
    super(config);

    // this.valueTS = config.createTimeSeries();
    this.lowTS = config.createTimeSeries({ color: Colors.BLUE });
    this.highTS = config.createTimeSeries({ color: Colors.RED });

    this.helper = new MultiLevelHelper(config.audioSource);
  }

  public render(context: Visualization.FrameContext): void {
    this.helper.sample(context.elapsedMillis);

    this.lowTS.value = this.helper.lowLevel;
    this.highTS.value = this.helper.highLevel;
  }
}

const factory = new Visualization.Factory(NAME, TestBandsVisualization);
export default factory;
