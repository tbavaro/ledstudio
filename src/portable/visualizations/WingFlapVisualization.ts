import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const SPEED = 3 / 1000;
const VERTICAL_SHARPNESS = 7;
const FLAPPINESS = 2;
const TIP_DISTANCE = 0.65; // 0 to 1
const TIP_FADE = 4;

const DEREZ = 0.4;

// derived
const PERIOD = Math.PI * 2 / SPEED;

// TODO improve flap motion
// TODO see if we can smooth it out by not perfectly following ribs

export default class WingFlapVisualization extends PianoVisualization.DerezPianoVisualization {
  private phase = 0;

  constructor(numLeds: number[]) {
    super(numLeds, DEREZ);
  }

  public renderPure(elapsedMillis: number, state: PianoVisualization.State): void {
    this.phase = (this.phase + elapsedMillis * SPEED) % PERIOD;

    const position = Math.pow(Math.sin(this.phase), FLAPPINESS) * (this.ledRows.length - 1);

    this.pureLedRows.forEach((leds, row) => {
      const rowV = Math.pow(1 - (Math.abs(position - row) / (this.ledRows.length)), VERTICAL_SHARPNESS);
      const rowColor = Colors.hsv(0, 0, rowV);
      for (let i = 0; i < leds.length; ++i) {
        // -1 on left, 0 in middle, 1 on right
        const x = (i - (leds.length - 1) / 2) / ((leds.length - 1) / 2);

        // 1 at the tips, 0 where tips "start"
        const tippiness = Math.max(0, Math.abs(x) - TIP_DISTANCE) / (1 - TIP_DISTANCE);
        const color = Colors.multiply(rowColor, Math.pow(1 - tippiness, TIP_FADE));
        leds.set(i, color);
      }
    });
  }
}