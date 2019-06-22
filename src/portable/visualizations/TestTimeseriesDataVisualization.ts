import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

export default class TestTimeseriesDataVisualization extends Visualization.default {
  private phase = 0;

  constructor(scene: Scene) {
    super(scene);
  }

  public render(elapsedMillis: number, state: Visualization.State, context: Visualization.Context): void {
    this.phase = (this.phase + elapsedMillis / 1000) % (Math.PI * 2);

    context.setFrameTimeseriesPoints([
      {
        color: Colors.WHITE,
        value: (Math.sin(this.phase) + 1) / 2
      },
      {
        color: Colors.GREEN,
        value: (Math.cos(this.phase * 5) + 1) / 2
      },
      {
        color: Colors.BLUE,
        value: ((this.phase * 10) % (Math.PI * 2) < Math.PI) ? 0.5 : null
      },
    ]);
  }
}
