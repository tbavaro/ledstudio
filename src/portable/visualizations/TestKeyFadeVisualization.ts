import Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization, { State } from "../base/PianoVisualization";

function colorForValue(v: number) {
  if (v < 0) {
    v = 0;
  } else if (v > 1) {
    v = 1;
  }

  const x = Math.floor(v * 255);

  // tslint:disable-next-line: no-bitwise
  return (x << 16) + (x << 8) + x;
}

function updateValues<T>(arr: T[], func: (oldValue: T) => T) {
  for (let i = 0; i < arr.length; ++i) {
    arr[i] = func(arr[i]);
  }
}

export default class TestKeyVisualization extends PianoVisualization {
  private readonly values: number[];
  private readonly decayRate = 3 / 1000;

  constructor(ledStrip: LedStrip) {
    super(ledStrip);
    ledStrip.reset(Colors.BLACK);

    this.values = new Array(ledStrip.size).fill(0);
  }

  public render(elapsedMillis: number, state: State): void {
    // decay
    const decayAmount = elapsedMillis * this.decayRate;
    updateValues(this.values, (oldValue: number) => Math.max(0, oldValue - decayAmount));

    // turn on newly-pressed keys
    state.changedKeys.forEach(n => {
      if (state.keys[n]) {
        this.values[n] = 1;
      }
    });

    // set colors
    this.values.forEach((v, i) => this.ledStrip.setColor(i, colorForValue(v)));
  }
}
