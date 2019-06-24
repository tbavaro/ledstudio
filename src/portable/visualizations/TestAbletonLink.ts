import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import AbletonLinkConnect from "./util/AbletonLinkConnect";

export default class TestAbletonLink extends Visualization.default {

  private link: AbletonLinkConnect;

  constructor(config: Visualization.Config) {
    super(config);
    this.link = new AbletonLinkConnect();
  }


  public render(context: Visualization.FrameContext): void {

    const duringBeat = this.link.timeSinceLastBeat() < 0.1 && (this.link.beatsSinceSync() % 4 === 0);

    this.ledRows.forEach(row => {
      row.fill(duringBeat ? Colors.WHITE : Colors.BLACK);
    });

    context.setFrameTimeseriesPoints([
      {
        color: Colors.WHITE,
        value: duringBeat ? 1 : 0
      },
      {
        color: Colors.RED,
        value: this.link.progressToNextBeat()
      },
      {
        color: Colors.BLUE,
        value: this.link.timeSinceLastBeat()
      }
    ]);
  }
}
