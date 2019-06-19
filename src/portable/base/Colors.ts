import * as Utils from "../Utils";

export type Color = number;

const MAX_VALUE = 0xff;

// 0-MAX_VALUE for each
export function rgbUnchecked(r: number, g: number, b: number): Color {
  // tslint:disable-next-line: no-bitwise
  return (r << 16) | (g << 8) | b;
}

export function splitRGB(color: Color): [number, number, number] {
  // tslint:disable-next-line: no-bitwise
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

export function cssColor(color: Color): string {
  const [r, g, b] = splitRGB(color);
  return `rgb(${r}, ${g}, ${b})`;
}

// h in [0., 360.0)
// s in [0, 1]
// b in [0, 1]
function hsvUnchecked(h: number, s: number, v: number): Color {
  let r: number;
  let g: number;
  let b: number;
  const sector = h / 60;
  const i = Math.floor(sector);
  const f = sector - i;  // remainder part of h
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;

    case 1:
      r = q;
      g = v;
      b = p;
      break;

    case 2:
      r = p;
      g = v;
      b = t;
      break;

    case 3:
      r = p;
      g = q;
      b = v;
      break;

    case 4:
      r = t;
      g = p;
      b = v;
      break;

    default: // (5)
      r = v;
      g = p;
      b = q;
      break;
  }

  return rgbUnchecked(r * MAX_VALUE, g * MAX_VALUE, b * MAX_VALUE);
}

const bracket01 = Utils.bracket01;
const bracket0MAX = Utils.createBracketFunc(0, MAX_VALUE);

export function rgb(r: number, g: number, b: number): Color {
  return rgbUnchecked(
    bracket01(r) * MAX_VALUE,
    bracket01(g) * MAX_VALUE,
    bracket01(b) * MAX_VALUE
  );
}

export function split(color: Color): [number, number, number] {
  const splitRgb = splitRGB(color);
  return [splitRgb[0] / MAX_VALUE, splitRgb[1] / MAX_VALUE, splitRgb[2] / MAX_VALUE];
}

export function hsv(h: number, s: number, v: number): Color {
  h = h % 360;
  if (h < 0) {
    h += 360;
  }
  return hsvUnchecked(h, bracket01(s), bracket01(v));
}

export function add(a: Color, b: Color): Color {
  const [ar, ag, ab] = splitRGB(a);
  const [br, bg, bb] = splitRGB(b);
  return rgbUnchecked(
    bracket0MAX(ar + br),
    bracket0MAX(ag + bg),
    bracket0MAX(ab + bb)
  );
}

export function average(a: Color, b: Color): Color {
  const [ar, ag, ab] = splitRGB(a);
  const [br, bg, bb] = splitRGB(b);
  return rgbUnchecked(
    bracket0MAX(Math.floor((ar + br) / 2)),
    bracket0MAX(Math.floor((ag + bg) / 2)),
    bracket0MAX(Math.floor((ab + bb) / 2))
  );
}

export function multiply(a: Color, factor: number): Color {
  const [ar, ag, ab] = splitRGB(a);
  return rgbUnchecked(
    bracket0MAX(Math.floor(ar * factor)),
    bracket0MAX(Math.floor(ag * factor)),
    bracket0MAX(Math.floor(ab * factor))
  );
}

function fadeLinearUnchecked(fromColor: Color, toColor: Color, v: number): Color {
  return add(
    multiply(fromColor, (1 - v)),
    multiply(toColor, v)
  );
}

export function fadeLinear(fromColor: Color, toColor: Color, v: number): Color {
  return fadeLinearUnchecked(fromColor, toColor, bracket01(v));
}

export function createPaletteFadeLinear(fromColor: Color, toColor: Color, size: number): Color[] {
  return Utils.fillArray(size, (i: number) => {
    const v = i / (size - 1);
    return fadeLinearUnchecked(fromColor, toColor, v);
  });
}

export const BLACK = rgb(0, 0, 0);
export const WHITE = rgb(1, 1, 1);
export const RED = rgb(1, 0, 0);
export const GREEN = rgb(0, 1, 0);
export const BLUE = rgb(0, 0, 1);
