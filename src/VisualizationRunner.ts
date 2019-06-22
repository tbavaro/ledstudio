import * as Colors from "./portable/base/Colors";
import ControllerState from "./portable/base/ControllerState";
import FixedArray from "./portable/base/FixedArray";
import PianoEvent from "./portable/base/PianoEvent";
import * as TimeseriesData from "./portable/base/TimeseriesData";
import * as Visualization from "./portable/base/Visualization";

import * as PianoHelpers from "./portable/PianoHelpers";
import { SendableLedStrip } from "./portable/SendableLedStrip";
import { MovingAverageHelper } from "./portable/Utils";

import FadecandyLedSender from "./hardware/FadecandyLedSender";

import Scene from "./scenes/Scene";

class MyFrameContext implements Visualization.FrameContext {
  public elapsedMillis: number;
  public pianoState: PianoHelpers.VisualizationStateHelper;
  public analogFrequencyData: Uint8Array;
  public controllerState: ControllerState;
  public frameTimeseriesPoints: TimeseriesData.PointDef[] | undefined;

  constructor() {
    const UNSET = "<unset>" as any;
    this.elapsedMillis = UNSET;
    this.pianoState = new PianoHelpers.VisualizationStateHelper();
    this.analogFrequencyData = UNSET;
    this.controllerState = UNSET;
  }

  public setFrameTimeseriesPoints(points: TimeseriesData.PointDef[]) {
    if (this.frameTimeseriesPoints === undefined) {
      this.frameTimeseriesPoints = points;
    } else {
      throw new Error("frame timeseries points set multiple times");
    }
  }

  public startFrame() {
    this.pianoState.startFrame();
  }

  public endFrame(elapsedMillis: number, analogFrequencyData: Uint8Array, controllerState: ControllerState) {
    this.elapsedMillis = elapsedMillis;
    this.analogFrequencyData = analogFrequencyData;
    this.controllerState = controllerState;
    this.pianoState.endFrame();
    this.frameTimeseriesPoints = undefined;
  }

  public applyPianoEvent(event: PianoEvent) {
    this.pianoState.applyEvent(event);
  }
}

export default class VisualizationRunner {
  public readonly visualization: Visualization.default;
  private readonly timingHelper: MovingAverageHelper;
  private lastRenderTime: number = 0;
  public hardwareLedSender?: FadecandyLedSender;
  public simulationLedStrip?: SendableLedStrip;
  private adjustedLedRows: FixedArray<FixedArray<Colors.Color>>;
  private readonly frameContext: MyFrameContext;

  constructor(visualization: Visualization.default, scene: Scene) {
    this.visualization = visualization;
    this.timingHelper = new MovingAverageHelper(20);
    this.adjustedLedRows = visualization.ledRows.map(row => row.map(_ => Colors.BLACK));
    this.frameContext = new MyFrameContext();
  }

  public renderFrame(analogFrequencyData: Uint8Array, controllerState: ControllerState): TimeseriesData.PointDef[] {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // collect state
    this.frameContext.endFrame(
      startTime - this.lastRenderTime,
      analogFrequencyData,
      controllerState
    );

    // render into the LED strip
    this.visualization.render(this.frameContext);
    const frameTimeseriesPoints = this.frameContext.frameTimeseriesPoints || [];

    this.frameContext.startFrame();
    this.lastRenderTime = startTime;

    // timing
    const visTimeMillis = performance.now() - startTime;
    this.timingHelper.addValue(visTimeMillis);

    // send
    const multiplier = controllerState === null ? 1 : controllerState.dialValues[7];
    this.sendToStrips(multiplier);

    return frameTimeseriesPoints;
  }

  public onPianoEvent(event: PianoEvent) {
    this.frameContext.applyPianoEvent(event);
  }

  public get averageRenderTime() {
    return this.timingHelper.movingAverage;
  }

  private sendToStrips(multiplier: number) {
    this.visualization.ledRows.forEach((row, rowIdx) => {
      const outputRow = this.adjustedLedRows.get(rowIdx);
      row.forEach((color, i) => {
        outputRow.set(i, Colors.multiply(color, multiplier));
      });
    });

    if (this.simulationLedStrip !== undefined) {
      const strip = this.simulationLedStrip;
      let i = 0;
      this.adjustedLedRows.forEach(row => {
        row.forEach(color => {
          strip.setColor(i++, color);
        });
      });
      strip.send();
    }

    if (this.hardwareLedSender !== undefined) {
      this.hardwareLedSender.send(this.adjustedLedRows);
    }
  }
}
