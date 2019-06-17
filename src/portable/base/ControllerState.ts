import MidiEvent from "../../piano/MidiEvent";

type ArrayOf8<T> = [T, T, T, T, T, T, T, T];

function arrayOf8Values<T>(value: T): ArrayOf8<T> {
  return new Array<T>(8).fill(value) as ArrayOf8<T>;
}

// TODO consider adding "presses since last frame" for buttons
export default class ControllerState {
  public readonly buttonStates: ArrayOf8<boolean>;
  public readonly dialValues: ArrayOf8<number>;  // 0 to 1, inclusive

  constructor() {
    this.buttonStates = arrayOf8Values(false);
    this.dialValues = arrayOf8Values(0);

    // default the last dial to 1 since it's used as global brightness
    this.dialValues[7] = 1;
  }

  public handleEvent(event: MidiEvent) {
    if (event.data.length !== 3) {
      return;
    }

    const statusByte = event.data[0];
    switch (statusByte) {
      case 0x8a: // button
      case 0x9a:
        const isPress = (statusByte === 0x9a);
        const buttonIndex = event.data[1] - 0x24;
        if (buttonIndex >= 0 && buttonIndex < 8) {
          this.buttonStates[buttonIndex] = isPress;
        }
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
}
