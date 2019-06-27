import Scene from "../../scenes/Scene";

import ColorRow from "./ColorRow";
import * as Colors from "./Colors";
import FixedArray from "./FixedArray";
import LedInfo from "./LedInfo";
import PianoState from "./PianoState";

export interface TimeSeriesValueSetter {
  // value should be between 0 and 1
  set: (value: number | null) => void;
}

export interface ControllerDialValueGetter {
  // value will be between 0 and 1
  get: () => number;
}

export interface Config {
  readonly scene: Scene;
  readonly audioSource: AudioNode | null;
  setExtraDisplay: (element: HTMLElement) => void;

  createTimeSeries: (attrs?: {
    // if `color` is not defined, will try to pick something reasonable
    color?: Colors.Color
  }) => TimeSeriesValueSetter;

  createDialControl: (attrs?: {
    // label?: string;

    // if not specified, will use the next unused dial
    // - this is 1-indexed, as that is how they are labeled on the device
    // - dial #8 is reserved for global brightness; visualizations can still
    //   read it and set its initial value though
    dialNumber?: number;

    // default 0
    // initialValue?: number;
  }) => ControllerDialValueGetter;
}

export interface FrameContext {
  elapsedMillis: number;

  pianoState: PianoState;

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
