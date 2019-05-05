import * as Colors from "../base/Colors";
import LedStrip, { MultipleLedStrip, PartialLedStrip } from "../base/LedStrip";
import PianoVisualization from "../base/PianoVisualization";

const FRONT_LENGTH = 88;

export default abstract class StandardPianoVisualization extends PianoVisualization {
  protected readonly frontLedStrip: LedStrip;

  constructor(ledStrip: LedStrip) {
    super();
    ledStrip.reset(Colors.BLACK);

    if (ledStrip.size % FRONT_LENGTH !== 0) {
      throw new Error(`expected led strip length to be a multiple of ${FRONT_LENGTH}`);
    }

    const frontLedStrips: PartialLedStrip[] = [];
    let reverse: boolean = false;
    for (let i = 0; i < ledStrip.size; i += FRONT_LENGTH) {
      frontLedStrips.push(new PartialLedStrip(ledStrip, i, 88, reverse));
      reverse = !reverse;
    }

    this.frontLedStrip = new MultipleLedStrip(frontLedStrips);
  }
}
