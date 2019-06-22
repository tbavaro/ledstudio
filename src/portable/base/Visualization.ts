import Scene from "../../scenes/Scene";

import ColorRow from "./ColorRow";
import * as Colors from "./Colors";
import ControllerState from "./ControllerState";
import FixedArray from "./FixedArray";
import LedInfo from "./LedInfo";
import PianoState from "./PianoState";
import * as TimeseriesData from "./TimeseriesData";

export interface State {
  pianoState: PianoState;

  // TODO probably give a better interface here
  analogFrequencyData: Uint8Array;

  controllerState: ControllerState;
}

export interface Context {
  setFrameTimeseriesPoints: (data: TimeseriesData.PointDef[]) => void;
}

export default abstract class Visualization {
  public readonly scene: Scene;
  public readonly ledInfos: LedInfo[][];
  public readonly ledRows: FixedArray<ColorRow>;

  constructor(scene: Scene) {
    this.scene = scene;
    this.ledInfos = scene.leds;
    this.ledRows = new FixedArray(this.ledInfos.length, i => new ColorRow(this.ledInfos[i].length));
  }

  public abstract render(elapsedMillis: number, state: State, context: Context): void;
}

export abstract class SingleRowVisualization extends Visualization {
  private static UNMAPPED_LED_COLOR = Colors.hsv(300, 1, 0.25);

  protected readonly length: number;
  protected readonly leds: ColorRow;

  constructor(scene: Scene, length: number) {
    super(scene);
    this.length = length;
    this.leds = new ColorRow(length);
  }

  protected abstract renderSingleRow(elapsedMillis: number, state: State, context: Context): void;

  public render(elapsedMillis: number, state: State, context: Context): void {
    this.renderSingleRow(elapsedMillis, state, context);

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
    super(delegate.scene);
    this.delegate = delegate;
    this.derez = derez;
  }

  public render(elapsedMillis: number, state: State, context: Context): void {
    this.delegate.render(elapsedMillis, state, context);

    this.delegate.ledRows.forEach((pureLeds, row) => {
      const leds = this.ledRows.get(row);
      leds.copyFancy(pureLeds, { derezAmount: this.derez });
    });
  }
}
