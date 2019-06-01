import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

export default class TestTimeseriesDataVisualization extends PianoVisualization.default {
  private phase = 0;

  constructor() {
    super([0]);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State, context: PianoVisualization.Context): void {
    this.phase = (this.phase + elapsedMillis / 1000) % (Math.PI * 2);

    context.setFrameTimeseriesPoints([
      {
        color: Colors.WHITE,
        value: Math.sin(this.phase)
      }
    ]);
  }
}
