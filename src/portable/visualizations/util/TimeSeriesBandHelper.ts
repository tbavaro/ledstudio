import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

import WindowStats from "../../../util/WindowStats";

export default class TimeSeriesBandHelper extends WindowStats {
  public readonly color: Colors.Color;
  private readonly valueTS: Visualization.TimeSeriesValue;
  private readonly highTS: Visualization.TimeSeriesValue;
  private readonly lowTS: Visualization.TimeSeriesValue;

  constructor(attrs: {
    config: Visualization.Config,
    maxSize: number,
    color?: Colors.Color
  }) {
    super(attrs.maxSize);

    this.valueTS = attrs.config.createTimeSeries({ color: attrs.color });
    this.color = this.valueTS.color;

    const bandColor = Colors.multiply(this.color, 0.5);
    this.highTS = attrs.config.createTimeSeries({ color: bandColor });
    this.lowTS = attrs.config.createTimeSeries({ color: bandColor });
  }

  public push(v: number) {
    const oldValue = super.push(v);

    const mean = this.mean;
    const stddev = this.stddev;

    this.valueTS.value = v;
    this.highTS.value = mean + stddev;
    this.lowTS.value = mean - stddev;

    return oldValue;
  }

  public stdDevsFromMean(v: number) {
    const mean = this.mean;
    const stddev = this.stddev;

    return (v - mean) / stddev;
  }
}
