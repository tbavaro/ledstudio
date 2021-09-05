import MidiEvent from "../../piano/MidiEvent";
import { removeAll } from "../../util/Utils";

type ArrayOf8<T> = [T, T, T, T, T, T, T, T];

function arrayOf8Values<T>(value: T): ArrayOf8<T> {
  return new Array<T>(8).fill(value) as ArrayOf8<T>;
}

export default class ControllerState {
  public readonly buttonStates: ArrayOf8<boolean>;
  public readonly pressesSinceLastFrame: number[];
  public readonly releasesSinceLastFrame: number[];
  public readonly dialValues: ArrayOf8<number>; // 0 to 1, inclusive

  constructor() {
    this.buttonStates = arrayOf8Values(false);
    this.dialValues = arrayOf8Values(0);
    this.pressesSinceLastFrame = [];
    this.releasesSinceLastFrame = [];

    // default the last dial to 1 since it's used as global brightness
    // TODO maybe make this a sticky setting, since IRL full brightness might be a lot
    this.dialValues[7] = 1;

    this.reset();
  }

  public startFrame() {
    removeAll(this.pressesSinceLastFrame);
    removeAll(this.releasesSinceLastFrame);
  }

  public reset() {
    const oldDerez = this.dialValues[6];
    const oldBrightness = this.dialValues[7];

    this.dialValues.fill(0);

    // don't let a new visualization's derez be 1
    this.dialValues[6] = Math.min(0.95, oldDerez);

    // don't let a new visualization's brightness be 0
    this.dialValues[7] = Math.max(0.05, oldBrightness);
  }

  public handleEvent(event: MidiEvent) {
    if (event.data.length !== 3) {
      return;
    }

    const statusByte = event.data[0];
    switch (statusByte) {
      case 0x8a: // button
      case 0x9a:
        const isPress = statusByte === 0x9a;
        const buttonIndex = event.data[1] - 0x24;
        this.setButtonState(buttonIndex, isPress);
        break;

      case 0xb0: // dial
        const dialIndex = event.data[1] - 1;
        const valueNormalized = event.data[2] / 0x7f;
        if (dialIndex >= 0 && dialIndex < 8) {
          this.dialValues[dialIndex] = valueNormalized;
        }
        break;

      default:
        break;
    }
  }

  public setButtonState(index: number, value: boolean) {
    if (index >= 0 && index < this.buttonStates.length) {
      this.buttonStates[index] = value;
      (value ? this.pressesSinceLastFrame : this.releasesSinceLastFrame).push(
        index
      );
    }
  }
}
