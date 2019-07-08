import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import { Signals } from "./util/SignalsHelper";

import { valueOrDefault } from "../../util/Utils";

const NAME = "testSignals";

type KeysOfType<T, TProp> = { [P in keyof T]: T[P] extends TProp ? P : never }[keyof T];

class MyVisualization extends Visualization.default {
  private readonly signals: Signals;

  private readonly updateFuncs: Array<() => void>;

  constructor(config: Visualization.Config) {
    super(config);

    this.updateFuncs = [];
    this.signals = config.signals;

    this.attachBooleanTimeSeries({
      color: Colors.RED,
      signalName: "isNewBeat",
      yValue: 0
    });

    this.attachBooleanTimeSeries({
      color: Colors.PURPLE,
      signalName: "soundsLikeNewBeat",
      yValue: 0.1
    });

    this.attachBooleanTimeSeries({
      color: Colors.YELLOW,
      signalName: "soundsLikeStrongBeat",
      yValue: 0.2
    });

    this.attachNumberTimeSeries({
      color: Colors.RED,
      signalName: "highLevel",
      scaledMinY: 0.5,
      scaledMaxY: 1
    });

    this.attachNumberTimeSeries({
      color: Colors.BLUE,
      signalName: "lowLevel",
      scaledMinY: 0.5,
      scaledMaxY: 1
    });
  }

  public render(context: Visualization.FrameContext): void {
    this.updateFuncs.forEach(f => f());
  }

  private attachTimeSeries<S extends keyof Signals>(attrs: {
    color: Colors.Color,
    signalName: S,
    mapToNormalizedValue: (value: Signals[S]) => number
  }) {
    const ts = this.config.createTimeSeries({
      color: attrs.color
    });

    this.updateFuncs.push(() => {
      const value = this.signals[attrs.signalName];
      ts.value = attrs.mapToNormalizedValue(value);
    });
  }

  private attachBooleanTimeSeries<S extends KeysOfType<Signals, boolean>>(attrs: {
    color: Colors.Color,
    signalName: S,
    yValue: number
  }) {
    this.attachTimeSeries({
      color: attrs.color,
      signalName: attrs.signalName,
      mapToNormalizedValue: (v: boolean) => v ? attrs.yValue : NaN
    });
  }

  private attachNumberTimeSeries<S extends KeysOfType<Signals, number>>(attrs: {
    color: Colors.Color,
    signalName: S,
    scaledMinY?: number,
    scaledMaxY?: number
  }) {
    const scaledMinY = valueOrDefault(attrs.scaledMinY, 0);
    const scaledMaxY = valueOrDefault(attrs.scaledMaxY, 1);

    this.attachTimeSeries({
      color: attrs.color,
      signalName: attrs.signalName,
      mapToNormalizedValue: (v: number) => {
        if (v < 0 || v > 1) {
          return NaN;
        } else {
          return scaledMinY + v * (scaledMaxY - scaledMinY);
        }
      }
    });
  }
}

const factory = new Visualization.Factory(NAME, MyVisualization);
export default factory;
