
import * as Colors from "./base/Colors";
import LedStrip from "./base/LedStrip";
import { ColorTransformLedStrip, MultipleLedStrip, PartialLedStrip } from "./CompositeLedStrips";

const FRONT_LENGTH = 88;

export function createBurrowSingleRowLedStrip(ledStrip: LedStrip, dropoffFactor?: number): LedStrip {
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
    const transform = (c: Colors.Color) => Colors.multiply(c, 1 - (dropoffFactor || 0));
    frontLedStrips[0] = new ColorTransformLedStrip(frontLedStrips[0], transform);
    frontLedStrips[2] = new ColorTransformLedStrip(frontLedStrips[2], transform);
  }

  return new MultipleLedStrip(frontLedStrips);
}