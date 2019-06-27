import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

export default class TestControllerDialVisualization extends Visualization.default {
  private readonly rDial: Visualization.DialControl;
  private readonly gDial: Visualization.DialControl;
  private readonly bDial: Visualization.DialControl;

  private readonly rTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly gTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly bTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);

    this.rDial = config.createDialControl();
    this.gDial = config.createDialControl();
    this.bDial = config.createDialControl();

    this.rTimeSeries = config.createTimeSeries({ color: Colors.RED });
    this.gTimeSeries = config.createTimeSeries({ color: Colors.GREEN });
    this.bTimeSeries = config.createTimeSeries({ color: Colors.BLUE });
  }

  public render(context: Visualization.FrameContext): void {
    const rValue = this.rDial.value;
    const gValue = this.gDial.value;
    const bValue = this.bDial.value;

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

    this.rTimeSeries.set(rValue);
    this.gTimeSeries.set(gValue);
    this.bTimeSeries.set(bValue);
  }
}
