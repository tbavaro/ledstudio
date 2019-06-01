import * as Colors from "./Colors";

export interface PointDef {
  color: Colors.Color;
  value: number | null;
}

export interface HeatmapDef {
  baseColor: Colors.Color;
  values: number[];
}
