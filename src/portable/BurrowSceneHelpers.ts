
import * as Colors from "./base/Colors";
import LedStrip from "./base/LedStrip";
import { ColorRow } from "./base/PianoVisualization";
import { ColorTransformLedStrip, MultipleLedStrip, PartialLedStrip } from "./CompositeLedStrips";

const FRONT_LENGTH = 88;

interface BurrowLedStrips {
  readonly frontLedStrips: LedStrip[];
}

function createBurrowLedStrips(ledStrip: LedStrip): BurrowLedStrips {
  if (ledStrip.size % FRONT_LENGTH !== 0) {
    throw new Error(`expected led strip length to be a multiple of ${FRONT_LENGTH}`);
  }

  const frontLedStrips: LedStrip[] = [];
  let reverse: boolean = false;
  for (let i = 0; i < ledStrip.size; i += FRONT_LENGTH) {
    frontLedStrips.push(new PartialLedStrip(ledStrip, i, 88, reverse));
    reverse = !reverse;
  }

  return {
    frontLedStrips: frontLedStrips
  };
}

export function createBurrowSingleRowLedStrip(ledStrip: LedStrip, dropoffFactor?: number): LedStrip {
  const { frontLedStrips } = createBurrowLedStrips(ledStrip);

  // hacky way to do this but ok
  if (frontLedStrips.length === 3) {
    const transform = (c: Colors.Color) => Colors.multiply(c, 1 - (dropoffFactor || 0));
    frontLedStrips[0] = new ColorTransformLedStrip(frontLedStrips[0], transform);
    frontLedStrips[2] = new ColorTransformLedStrip(frontLedStrips[2], transform);
  }

  return new MultipleLedStrip(frontLedStrips);
}

export function copySingleRow(from: ColorRow, to: ColorRow) {
  if (to.length % from.length !== 0) {
    throw new Error(`expcted 'to' to be a multiple of ${from.length}`);
  }

  const numRows = to.length / from.length;
  for (let row = 0; row < numRows; ++row) {
    const offset = row * from.length;
    const reverse = (row % 2 === 1);
    for (let i = 0; i < from.length; ++i) {
      to[offset + i] = from[(reverse ? (from.length - 1 - i) : i)];
    }
  }
}

