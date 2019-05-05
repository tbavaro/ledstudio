import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization from "../base/PianoVisualization";

import { ColorTransformLedStrip, MultipleLedStrip, PartialLedStrip } from "../CompositeLedStrips";

const FRONT_LENGTH = 88;
const DROPOFF_FACTOR = 0.6;

export default abstract class StandardPianoVisualization extends PianoVisualization {
  protected readonly frontLedStrip: LedStrip;

  constructor(ledStrip: LedStrip) {
    super();
    ledStrip.reset(Colors.BLACK);

    if (ledStrip.size % FRONT_LENGTH !== 0) {
      throw new Error(`expected led strip length to be a multiple of ${FRONT_LENGTH}`);
    }

    const frontLedStrips: LedStrip[] = [];
    let reverse: boolean = false;
    for (let i = 0; i < ledStrip.size; i += FRONT_LENGTH) {
      frontLedStrips.push(new PartialLedStrip(ledStrip, i, 88, reverse));
      reverse = !reverse;
    }

    // hacky way to do this but ok
    if (frontLedStrips.length === 3) {
      const transform = (c: Colors.Color) => Colors.multiply(c, 1 - DROPOFF_FACTOR);
      frontLedStrips[0] = new ColorTransformLedStrip(frontLedStrips[0], transform);
      frontLedStrips[2] = new ColorTransformLedStrip(frontLedStrips[2], transform);
    }

    this.frontLedStrip = new MultipleLedStrip(frontLedStrips);
  }
}
