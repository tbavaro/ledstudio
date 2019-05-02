import LedStrip from "../base/LedStrip";
import PianoVisualization from "../base/PianoVisualization";

import BounceVisualization from "./BounceVisualization";

const visFuncs = {
  "bounce": (ledStrip: LedStrip) => new BounceVisualization(ledStrip)
};

export type Name = keyof typeof visFuncs;

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, ledStrip: LedStrip): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](ledStrip);
}
