import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

export default class TestControllerDialVisualization extends Visualization.default {
  public render(elapsedMillis: number, state: Visualization.FrameState, context: Visualization.FrameContext): void {
    const dialValues = state.controllerState.dialValues;

    const rValue = dialValues[0];
    const gValue = dialValues[1];
    const bValue = dialValues[2];

    this.ledRows.forEach(row => {
      const midPoint = Math.floor(row.length / 2);
      const rDistance = rValue * midPoint;
      const gDistance = gValue * midPoint;
      const bDistance = bValue * midPoint;

      for (let i = 0; i < row.length; ++i) {
        const distance = Math.floor(Math.abs(midPoint - i));
        row.set(i, Colors.rgb(
          distance <= rDistance ? 1 : 0,
          distance <= gDistance ? 1 : 0,
          distance <= bDistance ? 1 : 0
        ));
      }
    });

    context.setFrameTimeseriesPoints([
      {
        color: Colors.RED,
        value: rValue
      },
      {
        color: Colors.GREEN,
        value: gValue
      },
      {
        color: Colors.BLUE,
        value: bValue
      }
    ]);
  }
}
