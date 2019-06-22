import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import { BasicFFT } from "../../analogAudio/AnalogAudio";

import { bracket } from "../Utils";

export default class TestAnalogPulseVisualization extends Visualization.default {
  private readonly fft: BasicFFT | null;

  constructor(config: Visualization.Config) {
    super(config);
    this.fft = (config.audioSource === null ? null : new BasicFFT(config.audioSource));
  }

  public render(context: Visualization.FrameContext): void {
    const analogFrequencyData = this.fft === null ? new Uint8Array(1) : this.fft.getFrequencyData();

    let total = 0;
    analogFrequencyData.forEach(v => total += v);

    // between 0 and 1
    const pulseValue = bracket(0, 1, total / analogFrequencyData.length / 255);

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
