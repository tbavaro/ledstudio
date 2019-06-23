import Scene from "../../scenes/Scene";

import ColorRow from "./ColorRow";
import * as Colors from "./Colors";
import ControllerState from "./ControllerState";
import FixedArray from "./FixedArray";
import LedInfo from "./LedInfo";
import PianoState from "./PianoState";
import * as TimeseriesData from "./TimeseriesData";

export interface Config {
  readonly scene: Scene;
  readonly audioSource: AudioNode | null;
  setExtraDisplay: (element: HTMLElement) => void;
}

export interface FrameContext {
  elapsedMillis: number;

  pianoState: PianoState;

  controllerState: ControllerState;

  setFrameHeatmapValues: (data: number[]) => void;
  setFrameTimeseriesPoints: (data: TimeseriesData.PointDef[]) => void;
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
