import PianoEvent from "./portable/base/PianoEvent";
import PianoVisualization, { Context } from "./portable/base/PianoVisualization";
import * as TimeseriesData from "./portable/base/TimeseriesData";

import * as PianoHelpers from "./portable/PianoHelpers";
import { SendableLedStrip } from "./portable/SendableLedStrip";
import { MovingAverageHelper } from "./portable/Utils";

import FadecandyLedSender from "./hardware/FadecandyLedSender";

import MidiEvent from "./piano/MidiEvent";
import { LedMapper, Scene } from "./scenes/Scene";

export default class PianoVisualizationRunner {
  private readonly stateHelper: PianoHelpers.PianoVisualizationStateHelper;
  public readonly visualization: PianoVisualization;
  private readonly timingHelper: MovingAverageHelper;
  private lastRenderTime: number = 0;
  public hardwareLedSender?: FadecandyLedSender;
  public simulationLedStrip?: SendableLedStrip;
  private readonly ledMapper: LedMapper;

  constructor(visualization: PianoVisualization, scene: Scene) {
    this.visualization = visualization;
    this.stateHelper = new PianoHelpers.PianoVisualizationStateHelper();
    this.timingHelper = new MovingAverageHelper(20);
    this.ledMapper = scene.createLedMapper(visualization);
  }

  public renderFrame(analogFrequencyData: Uint8Array): TimeseriesData.PointDef[] {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // collect state
    const visState = this.stateHelper.endFrame(analogFrequencyData);
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
    this.sendToStrips();

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

  private sendToStrips() {
    if (this.simulationLedStrip !== undefined) {
      const strip = this.simulationLedStrip;
      const colors = this.ledMapper.mapLeds();
      let i = 0;
      colors.forEach(row => {
        row.forEach(color => {
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
