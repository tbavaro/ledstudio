import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";
import { bracket } from "../Utils";

export default class TestAnalogPulseVisualization extends PianoVisualization.default {
  constructor(numLeds: number[]) {
    super(numLeds);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State, context: PianoVisualization.Context): void {
    const frequencyData = state.analogFrequencyData;
    let total = 0;
    frequencyData.forEach(v => total += v);

    // between 0 and 1
    const pulseValue = bracket(0, 1, total / frequencyData.length / 255);

    this.ledRows.forEach(row => {
      row.fill(Colors.BLACK);
      const midPoint = Math.floor(row.length / 2);
      const pulseWidth = pulseValue * row.length;
      const startIndex = Math.max(0, Math.floor(midPoint - pulseWidth / 2));
      const endIndex = Math.min(row.length - 1, Math.floor(midPoint + pulseWidth / 2));

      for (let i = startIndex; i <= endIndex; ++i) {
        row.set(i, Colors.WHITE);
      }
    });

    context.setFrameTimeseriesPoints([
      {
        color: Colors.WHITE,
        value: pulseValue
      }
    ]);
  }
}
