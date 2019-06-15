import * as Colors from "./portable/base/Colors";
import ControllerState from "./portable/base/ControllerState";
import PianoEvent from "./portable/base/PianoEvent";
import PianoVisualization, { Context } from "./portable/base/PianoVisualization";
import * as TimeseriesData from "./portable/base/TimeseriesData";

import * as PianoHelpers from "./portable/PianoHelpers";
import { SendableLedStrip } from "./portable/SendableLedStrip";
import { MovingAverageHelper } from "./portable/Utils";

import FadecandyLedSender from "./hardware/FadecandyLedSender";

import MidiEvent from "./piano/MidiEvent";
import Scene from "./scenes/Scene";

export default class PianoVisualizationRunner {
  private readonly stateHelper: PianoHelpers.PianoVisualizationStateHelper;
  public readonly visualization: PianoVisualization;
  private readonly timingHelper: MovingAverageHelper;
  private lastRenderTime: number = 0;
  public hardwareLedSender?: FadecandyLedSender;
  public simulationLedStrip?: SendableLedStrip;

  constructor(visualization: PianoVisualization, scene: Scene) {
    this.visualization = visualization;
    this.stateHelper = new PianoHelpers.PianoVisualizationStateHelper();
    this.timingHelper = new MovingAverageHelper(20);
  }

  public renderFrame(analogFrequencyData: Uint8Array, controllerState: ControllerState | null): TimeseriesData.PointDef[] {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // collect state
    const visState = this.stateHelper.endFrame(analogFrequencyData, controllerState);
    let frameTimeseriesPoints: TimeseriesData.PointDef[] | undefined;
    const context: Context = {
      setFrameTimeseriesPoints: (points: TimeseriesData.PointDef[]) => {
        if (frameTimeseriesPoints === undefined) {
          frameTimeseriesPoints = points;
        } else {
          throw new Error("frame timeseries points set multiple times");
        }
      }
    };

    // render into the LED strip
    const elapsedMillis = startTime - this.lastRenderTime;
    this.visualization.render(elapsedMillis, visState, context);
    this.stateHelper.startFrame();
    this.lastRenderTime = startTime;

    // timing
    const visTimeMillis = performance.now() - startTime;
    this.timingHelper.addValue(visTimeMillis);

    // send
    const multiplier = controllerState === null ? 1 : controllerState.dialValues[7];
    this.sendToStrips(multiplier);

    return frameTimeseriesPoints || [];
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
    if (this.simulationLedStrip !== undefined) {
      const strip = this.simulationLedStrip;
      let i = 0;
      this.visualization.ledRows.forEach(row => {
        row.forEach(color => {
          if (multiplier !== -1) {
            color = Colors.multiply(color, multiplier);
          }
          strip.setColor(i++, color);
        });
      });
      strip.send();
    }

    if (this.hardwareLedSender !== undefined) {
      this.hardwareLedSender.send(this.visualization.ledRows);
    }
  }
}
