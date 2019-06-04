import Scene from "../../scenes/Scene";

import ColorRow from "./ColorRow";
import * as Colors from "./Colors";
import FixedArray from "./FixedArray";
import LedInfo from "./LedInfo";
import * as TimeseriesData from "./TimeseriesData";

export interface State {
  // 88 booleans; true = pressed, false = released
  keys: boolean[];

  // velocity (0-1) of most recent key event (press OR release)
  keyVelocities: number[];

  // sorted indexes of keys changed since last frame
  changedKeys: ReadonlyArray<number>;

  // TODO probably give a better interface here
  analogFrequencyData: Uint8Array;
}

export interface Context {
  setFrameTimeseriesPoints: (data: TimeseriesData.PointDef[]) => void;
}

export default abstract class PianoVisualization {
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

export abstract class SingleRowPianoVisualization extends PianoVisualization {
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
      ledRow.fill(SingleRowPianoVisualization.UNMAPPED_LED_COLOR);

      const start = Math.floor((ledRow.length - this.length) / 2);
      this.leds.copy(ledRow, start);
    });
  }
}

export class DerezPianoVisualization extends PianoVisualization {
  private readonly delegate: PianoVisualization;
  private readonly derez: number;

  constructor(delegate: PianoVisualization, derez: number) {
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
