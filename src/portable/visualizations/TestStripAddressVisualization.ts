import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const MINOR_SEGMENT_LENGTH = 64;  // fadecandy channel
const MAJOR_SEGMENT_LENGTH = 512;  // fadecandy unit

const MAJOR_SEGMENT_START_COLOR = Colors.WHITE;
const MINOR_SEGMENT_START_BRIGHTNESS = 1;
const NORMAL_BRIGHTNESS = 0.3;
const PULSE_BRIGHTNESS = 0.5;

const LED_ZERO_BLINK_TIME = 1000;

const PULSE_SEPARATION_LEDS = 8;
const PULSE_SPEED_LEDS_PER_SECOND = 16;

const SEGMENT_HUE_INCREMENT = 210;

export default class TestStripAddressVisualization extends PianoVisualization.default {
  private timeCounter: number = 0;
  private pulseLocationFloat: number = 0;

  constructor(numLeds: number[]) {
    super(numLeds);
  }

  public render(elapsedMillis: number): void {
    this.pulseLocationFloat = (this.pulseLocationFloat + PULSE_SPEED_LEDS_PER_SECOND * elapsedMillis / 1000) % MINOR_SEGMENT_LENGTH;
    const pulseLocation = Math.floor(this.pulseLocationFloat);

    this.timeCounter = (this.timeCounter + elapsedMillis) % LED_ZERO_BLINK_TIME;
    const flashBrightness = 2 * Math.abs(0.5 - this.timeCounter / LED_ZERO_BLINK_TIME);

    this.ledRows.forEach((row, rowIdx) => {
      for (let i = 0; i < row.length; ++i) {
        row.set(i, this.colorForPixel(rowIdx, i, flashBrightness, pulseLocation));
      }
    });
  }

  private colorForPixel(rowIdx: number, n: number, flashBrightness: number, pulseLocation: number): Colors.Color {
    if (n % MAJOR_SEGMENT_LENGTH <= rowIdx) {
      return Colors.multiply(MAJOR_SEGMENT_START_COLOR, flashBrightness);
    } else if (n % MAJOR_SEGMENT_LENGTH <= rowIdx) {
      return MAJOR_SEGMENT_START_COLOR;
    } else {
      const segmentNumber = Math.floor(n / MINOR_SEGMENT_LENGTH);
      const hue = (segmentNumber * SEGMENT_HUE_INCREMENT) % 360;
      let brightness;
      if (n % MINOR_SEGMENT_LENGTH <= rowIdx) {
        brightness = MINOR_SEGMENT_START_BRIGHTNESS;
      } else if ((n - pulseLocation) % PULSE_SEPARATION_LEDS === 0) {
        brightness = PULSE_BRIGHTNESS;
      } else {
        brightness = NORMAL_BRIGHTNESS;
      }
      return Colors.hsv(hue, 1, brightness);
    }
  }
}
