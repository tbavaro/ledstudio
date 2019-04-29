import * as React from "react";

import "./PianoView.css";

const NUM_KEYS = 88;

function isBlackKey(n: number): boolean {
  switch (n % 12) {
    case 1:
    case 4:
    case 6:
    case 9:
    case 11:
      return true;

    default:
      return false;
  }
}

const NUM_WHITE_KEYS = (() => {
  let n = 0;
  for (let i = 0; i < NUM_KEYS; ++i) {
    if (!isBlackKey(i)) {
      n++;
    }
  }
  return n;
})();

const WHITE_KEY_WIDTH_PCT = 100 / NUM_WHITE_KEYS;
const WHITE_KEY_WIDTH_PCT_STR = `${WHITE_KEY_WIDTH_PCT}%`;
const BLACK_KEY_WIDTH_PCT = WHITE_KEY_WIDTH_PCT * 0.6;
const BLACK_KEY_WIDTH_PCT_STR = `${BLACK_KEY_WIDTH_PCT}%`;

export default class PianoView extends React.Component<{}, {}> {
  public render() {
    const whiteKeys: JSX.Element[] = [];
    const blackKeys: JSX.Element[] = [];
    let offset = -1;
    for (let n = 0; n < NUM_KEYS; ++n) {
      if (isBlackKey(n)) {
        blackKeys.push(this.renderBlackKey(n, offset));
      } else {
        whiteKeys.push(this.renderWhiteKey(n, ++offset));
      }
    }

    return (
      <div className="PianoView">
        <div className="PianoView-piano">
          {whiteKeys}
          {blackKeys}
        </div>
      </div>
    );
  }

  private renderWhiteKey(n: number, offset: number) {
    return (
      <div
        key={n}
        className="PianoView-whiteKey"
        style={{
          width: WHITE_KEY_WIDTH_PCT_STR,
          left: `${offset * WHITE_KEY_WIDTH_PCT}%`
        }}
      />
    );
  }

  private renderBlackKey(n: number, offset: number) {
    return (
      <div
        key={n}
        className="PianoView-blackKey"
        style={{
          width: BLACK_KEY_WIDTH_PCT_STR,
          left: `${(offset + 1) * WHITE_KEY_WIDTH_PCT - 0.5 * BLACK_KEY_WIDTH_PCT}%`
        }}
      />
    );
  }
}
