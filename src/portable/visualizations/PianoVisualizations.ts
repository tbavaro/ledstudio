import LedStrip from "../base/LedStrip";
import PianoVisualization from "../base/PianoVisualization";

import TestBounceVisualization from "./TestBounceVisualization";
import TestKeyVisualization from "./TestKeyVisualization";

const visFuncs = {
  "testBounce": (ledStrip: LedStrip) => new TestBounceVisualization(ledStrip),
  "testKey": (ledStrip: LedStrip) => new TestKeyVisualization(ledStrip)
};

export type Name = keyof typeof visFuncs;

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, ledStrip: LedStrip): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](ledStrip);
}
