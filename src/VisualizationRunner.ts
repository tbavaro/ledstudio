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

import MidiEvent from "./piano/MidiEvent";
import Scene from "./scenes/Scene";

export default class VisualizationRunner {
  private readonly stateHelper: PianoHelpers.VisualizationStateHelper;
  public readonly visualization: Visualization.default;
  private readonly timingHelper: MovingAverageHelper;
  private lastRenderTime: number = 0;
  public hardwareLedSender?: FadecandyLedSender;
  public simulationLedStrip?: SendableLedStrip;
  private adjustedLedRows: FixedArray<FixedArray<Colors.Color>>;
  private readonly frameContext: Visualization.FrameContext;
  private frameTimeseriesPoints: TimeseriesData.PointDef[] | undefined;

  constructor(visualization: Visualization.default, scene: Scene) {
    this.visualization = visualization;
    this.stateHelper = new PianoHelpers.VisualizationStateHelper();
    this.timingHelper = new MovingAverageHelper(20);
    this.adjustedLedRows = visualization.ledRows.map(row => row.map(_ => Colors.BLACK));
    this.frameContext = {
      elapsedMillis: 0,
      pianoState: this.stateHelper,
      analogFrequencyData: new Uint8Array(),
      controllerState: new ControllerState(),
      setFrameTimeseriesPoints: (points: TimeseriesData.PointDef[]) => {
        if (this.frameTimeseriesPoints === undefined) {
          this.frameTimeseriesPoints = points;
        } else {
          throw new Error("frame timeseries points set multiple times");
        }
      }
    };
  }

  public renderFrame(analogFrequencyData: Uint8Array, controllerState: ControllerState): TimeseriesData.PointDef[] {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // collect state
    const elapsedMillis = startTime - this.lastRenderTime;
    this.frameContext.elapsedMillis = elapsedMillis;
    this.frameContext.analogFrequencyData = analogFrequencyData;
    this.frameContext.controllerState = controllerState;
    this.frameTimeseriesPoints = undefined;
    this.stateHelper.endFrame();

    // render into the LED strip
    this.visualization.render(this.frameContext);
    this.stateHelper.startFrame();
    this.lastRenderTime = startTime;

    // timing
    const visTimeMillis = performance.now() - startTime;
    this.timingHelper.addValue(visTimeMillis);

    // send
    const multiplier = controllerState === null ? 1 : controllerState.dialValues[7];
    this.sendToStrips(multiplier);

    return this.frameTimeseriesPoints || [];
  }

  // TODO don't actually pass raw midi events in here, obv
  public onMidiEvent = (event: MidiEvent) => {
    if (event.pianoEvent !== null) {
      this.onPianoEvent(event.pianoEvent);
    }
  }

  public onPianoEvent = (event: PianoEvent) => this.stateHelper.applyEvent(event);

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
