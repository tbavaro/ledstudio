import ColorRow from "./ColorRow";
import FixedArray from "./FixedArray";

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

export default abstract class PianoVisualization {
  public readonly ledRows: FixedArray<ColorRow>;

  constructor(numLeds: number[]) {
    this.ledRows = new FixedArray(numLeds.length, i => new ColorRow(numLeds[i]));
  }

  public abstract render(elapsedMillis: number, state: State): void;
}

export abstract class SingleRowPianoVisualization extends PianoVisualization {
  public readonly ledRows: FixedArray<ColorRow>;
  protected readonly leds: ColorRow;

  constructor(numLeds: number) {
    super([numLeds]);
    this.leds = this.ledRows.get(0);
  }
}

export abstract class DerezPianoVisualization extends PianoVisualization {
  protected readonly pureLedRows: FixedArray<ColorRow>;
  private readonly derez: number;

  constructor(numLeds: number[], derez: number) {
    super(numLeds);
    this.pureLedRows = new FixedArray(numLeds.length, i => new ColorRow(numLeds[i]));
    this.derez = derez;
  }

  protected abstract renderPure(elapsedMillis: number, state: State): void;

  public render(elapsedMillis: number, state: State): void {
    this.renderPure(elapsedMillis, state);

    this.pureLedRows.forEach((pureLeds, row) => {
      const leds = this.ledRows.get(row);
      leds.copy(pureLeds, { derezAmount: this.derez });
    });
  }
}
