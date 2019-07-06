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
  private readonly halfLife: number;
  private readonly minThreshold: number;
  private readonly maxThreshold: number;

  constructor(attrs: {
    halfLife: number,
    minThreshold?: number,
    maxThreshold?: number
  }) {
    this.halfLife = attrs.halfLife;
    this.minThreshold = valueOrDefault(attrs.minThreshold, 0);
    this.maxThreshold = valueOrDefault(attrs.maxThreshold, 1);
  }

  public processValue(newValue: number, elapsedMillis: number) {
    const value = bracket01((newValue - this.minThreshold) / (this.maxThreshold - this.minThreshold));
    this.v.decayExponential(this.halfLife, elapsedMillis / 1000);
    this.v.bumpTo(value);
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

    if (audioSource !== null) {
      const context = audioSource.context;
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 3000;
      // filter.frequency.value = 150;
      audioSource.connect(filter);
      filter.connect(context.destination);
    }

    this.lowHelper = new LevelsHelper({
      halfLife: 0.125,
      minThreshold: 0.225,
      maxThreshold: 0.6
    });

    this.highHelper = new LevelsHelper({
      halfLife: 0.075,
      minThreshold: 0.1,
      maxThreshold: 0.75
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

   this.ledRows.get(0).fill(Colors.hsv(0, 0.5, this.highTS.value));
    this.ledRows.get(this.ledRows.length - 1).fill(Colors.hsv(240, 0.5, this.lowTS.value));
  }
}

const factory = new Visualization.Factory(NAME, TestBandsVisualization);
export default factory;
