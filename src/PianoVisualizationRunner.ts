import PianoEvent from "./portable/base/PianoEvent";
import PianoVisualization from "./portable/base/PianoVisualization";

import * as PianoHelpers from "./portable/PianoHelpers";
import { SendableLedStrip } from "./portable/SendableLedStrip";
import { MovingAverageHelper } from "./portable/Utils";

import MidiEvent from "./piano/MidiEvent";
import { LedMapper, Scene } from "./scenes/Scenes";

export default class PianoVisualizationRunner {
  private readonly stateHelper: PianoHelpers.PianoVisualizationStateHelper;
  public readonly visualization: PianoVisualization;
  private readonly timingHelper: MovingAverageHelper;
  private lastRenderTime: number = 0;
  public hardwardLedStrip?: SendableLedStrip;
  public simulationLedStrip?: SendableLedStrip;
  private readonly ledMapper: LedMapper;

  constructor(visualization: PianoVisualization, scene: Scene) {
    this.visualization = visualization;
    this.stateHelper = new PianoHelpers.PianoVisualizationStateHelper();
    this.timingHelper = new MovingAverageHelper(20);
    this.ledMapper = scene.createLedMapper(visualization);
  }

  public renderFrame() {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // render into the LED strip
    const visState = this.stateHelper.endFrame();
    const elapsedMillis = startTime - this.lastRenderTime;
    this.visualization.render(elapsedMillis, visState);
    this.stateHelper.startFrame();
    this.lastRenderTime = startTime;

    // timing
    const visTimeMillis = performance.now() - startTime;
    this.timingHelper.addValue(visTimeMillis);

    // send
    this.sendToStrips();
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
    const colors = this.ledMapper.mapLeds();
    [this.simulationLedStrip, this.hardwardLedStrip].forEach(strip => {
      if (strip !== undefined) {
        let i = 0;
        colors.forEach(row => {
          row.forEach(color => {
            strip.setColor(i++, color);
          });
        });
        strip.send();
      }
    });
  }
}
