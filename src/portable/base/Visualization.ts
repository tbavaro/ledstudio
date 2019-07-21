import Scene from "../../scenes/Scene";

import { Signals } from "../visualizations/util/SignalsHelper";

import BeatController from "./BeatController";

import ColorRow from "./ColorRow";
import * as Colors from "./Colors";
import FancyValue from "./FancyValue";
import FixedArray from "./FixedArray";
import LedInfo from "./LedInfo";
import PianoState from "./PianoState";

export class TimeSeriesValue extends FancyValue {
  public readonly color: Colors.Color;

  constructor(color: Colors.Color, initialValue?: number) {
    super(initialValue);
    this.color = color;
  }
}

export interface EasyTimeSeriesValueSetters {
  white: TimeSeriesValue;
  blue: TimeSeriesValue;
  red: TimeSeriesValue;
  yellow: TimeSeriesValue;
  green: TimeSeriesValue;
  orange: TimeSeriesValue;
}

export interface ButtonControl {
  readonly value: boolean;
  readonly pressedSinceLastFrame: boolean;
  readonly releasedSinceLastFrame: boolean;
}

export interface DialControl {
  // value will be between `minValue` and `maxValue` specified when it was created
  readonly value: number;
}

export interface Config {
  readonly scene: Scene;
  readonly audioSource: AudioNode;
  readonly signals: Signals;
  setExtraDisplay: (element: HTMLElement) => void;

  createTimeSeries: (attrs?: {
    // if `color` is not defined, will try to pick something reasonable
    color?: Colors.Color
  }) => TimeSeriesValue;

  createEasyTimeSeriesSet: () => EasyTimeSeriesValueSetters;

  createButtonControl: (attrs?: {
    // label?: string;

    // if not specified, will use the next unused button
    // - this is 1-indexed, as that is how they are labeled on the device
    buttonNumber?: number;
  }) => ButtonControl;

  createDialControl: (attrs?: {
    // label?: string;

    // if not specified, will use the next unused dial
    // - this is 1-indexed, as that is how they are labeled on the device
    // - dial #8 is reserved for global brightness; visualizations can still
    //   read it and set its initial value though
    dialNumber?: number;

    // default 0
    minValue?: number;

    // default 1; must be > minValue
    maxValue?: number;

    // defaults to `minValue`
    initialValue?: number;
  }) => DialControl;

  // resets all of the state (dials created, timeseries created, etc).
  // does not need to be called by normal visualizations
  reset(): void;
}

export interface FrameContext {
  elapsedMillis: number;  // deprecated
  elapsedSeconds: number;

  pianoState: PianoState;

  beatController: BeatController;

  setFrameHeatmapValues: (data: number[]) => void;
}

export default abstract class Visualization {
  public readonly config: Config;
  public readonly ledInfos: LedInfo[][];
  public readonly ledRows: FixedArray<ColorRow>;

  constructor(config: Config) {
    this.config = config;
    this.ledInfos = config.scene.leds;
    this.ledRows = new FixedArray(this.ledInfos.length, i => new ColorRow(this.ledInfos[i].length));
  }

  public abstract render(context: FrameContext): void;
}

export abstract class SingleRowVisualization extends Visualization {
  private static UNMAPPED_LED_COLOR = Colors.hsv(300, 1, 0.25);

  protected readonly length: number;
  protected readonly leds: ColorRow;

  constructor(config: Config, length: number) {
    super(config);
    this.length = length;
    this.leds = new ColorRow(length);
  }

  protected abstract renderSingleRow(context: FrameContext): void;

  public render(context: FrameContext): void {
    this.renderSingleRow(context);

    this.ledRows.forEach(ledRow => {
      ledRow.fill(SingleRowVisualization.UNMAPPED_LED_COLOR);

      const start = Math.floor((ledRow.length - this.length) / 2);
      this.leds.copy(ledRow, start);
    });
  }
}

export class DerezVisualization extends Visualization {
  private readonly delegate: Visualization;
  private readonly derez: number;

  constructor(delegate: Visualization, derez: number) {
    super(delegate.config);
    this.delegate = delegate;
    this.derez = derez;
  }

  public render(context: FrameContext): void {
    this.delegate.render(context);

    this.delegate.ledRows.forEach((pureLeds, row) => {
      const leds = this.ledRows.get(row);
      leds.copyFancy(pureLeds, { derezAmount: this.derez });
    });
  }
}

export class Factory {
  public readonly groupName: string;
  public readonly name: string;
  private readonly ctor: new (config: Config) => Visualization;

  constructor(attrs: {
    groupName: string;
    name: string;
    ctor: new (config: Config) => Visualization;
  }) {
    this.groupName = attrs.groupName;
    this.name = attrs.name;
    this.ctor = attrs.ctor;
  }

  public create(config: Config): Visualization {
    return new this.ctor(config);
  }
}
