import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const CHANNEL_START_COLOR = Colors.WHITE;
const NORMAL_BRIGHTNESS = 0.5;
const PULSE_BRIGHTNESS = 1.0;

const LED_ZERO_BLINK_TIME = 1000;

const PULSE_SEPARATION_LEDS = 8;
const PULSE_SPEED_LEDS_PER_SECOND = 16;

const SHOW_CHANNEL_NUMBER_AFTER_N_LEDS = 2;

export default class TestStripAddressVisualization extends Visualization.default {
  private timeCounter: number = 0;
  private pulseLocationFloat: number = 0;
  private readonly channelHueIncrement: number;

  constructor(config: Visualization.Config) {
    super(config);

    let maxChannel = 0;
    this.ledRowMetadatas.forEach(row => row.forEach(led => {
      if (led.hardwareChannel > maxChannel) {
        maxChannel = led.hardwareChannel;
      }
    }));

    const numChannels = maxChannel + 1;

    this.channelHueIncrement = 360 / numChannels;
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

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
    const ledMetadata = this.ledRowMetadatas[rowNumber][rowIndex];
    const n = ledMetadata.hardwareIndex;

    if (n >= SHOW_CHANNEL_NUMBER_AFTER_N_LEDS && n < (ledMetadata.hardwareChannel + SHOW_CHANNEL_NUMBER_AFTER_N_LEDS)) {
      return Colors.multiply(CHANNEL_START_COLOR, flashBrightness);
    } else {
      const segmentNumber = ledMetadata.hardwareChannel;
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
