import * as Colors from "../base/Colors";
import LedInfo from "../base/LedInfo";
import * as PianoVisualization from "../base/PianoVisualization";

const CHANNEL_START_COLOR = Colors.WHITE;
const NORMAL_BRIGHTNESS = 0.5;
const PULSE_BRIGHTNESS = 1.0;

const LED_ZERO_BLINK_TIME = 1000;

const PULSE_SEPARATION_LEDS = 8;
const PULSE_SPEED_LEDS_PER_SECOND = 16;

export default class TestStripAddressVisualization extends PianoVisualization.default {
  private timeCounter: number = 0;
  private pulseLocationFloat: number = 0;
  private readonly ledInfos: LedInfo[][];
  private readonly channelHueIncrement: number;

  constructor(ledInfos: LedInfo[][]) {
    super(ledInfos.map(row => row.length));
    this.ledInfos = ledInfos;

    let maxChannel = 0;
    ledInfos.forEach(row => row.forEach(led => {
      if (led.hardwareChannel > maxChannel) {
        maxChannel = led.hardwareChannel;
      }
    }));

    const numChannels = maxChannel + 1;

    this.channelHueIncrement = 360 / numChannels;
  }

  public render(elapsedMillis: number): void {
    this.pulseLocationFloat = (this.pulseLocationFloat + PULSE_SPEED_LEDS_PER_SECOND * elapsedMillis / 1000) % PULSE_SEPARATION_LEDS;
    const pulseLocation = Math.floor(this.pulseLocationFloat);

    this.timeCounter = (this.timeCounter + elapsedMillis) % LED_ZERO_BLINK_TIME;
    const flashBrightness = 2 * Math.abs(0.5 - this.timeCounter / LED_ZERO_BLINK_TIME);

    this.ledRows.forEach((row, rowIdx) => {
      for (let i = 0; i < row.length; ++i) {
        row.set(i, this.colorForPixel(rowIdx, i, flashBrightness, pulseLocation));
      }
    });
  }

  private colorForPixel(rowNumber: number, rowIndex: number, flashBrightness: number, pulseLocation: number): Colors.Color {
    const ledInfo = this.ledInfos[rowNumber][rowIndex];
    const n = ledInfo.hardwareIndex;

    if (n > 0 && n <= (ledInfo.hardwareChannel + 1)) {
      return Colors.multiply(CHANNEL_START_COLOR, flashBrightness);
    } else {
      const segmentNumber = ledInfo.hardwareChannel;
      const hue = (segmentNumber * this.channelHueIncrement) % 360;
      let brightness;
      if ((n - pulseLocation) % PULSE_SEPARATION_LEDS === 0) {
        brightness = PULSE_BRIGHTNESS;
      } else {
        brightness = NORMAL_BRIGHTNESS;
      }
      return Colors.hsv(hue, 1, brightness);
    }
  }
}
