export type Color = number;

const MAX_VALUE = 0xff;

const colors = {
  BLACK: rgb(0, 0, 0),
  WHITE: rgb(1, 1, 1),
  RED: rgb(1, 0, 0)
};
export default colors;

// 0-MAX_VALUE for each
function rgbUnchecked(r: number, g: number, b: number): Color {
  // tslint:disable-next-line: no-bitwise
  return (r << 16) | (g << 8) | b;
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
      r = t
      g = p
      b = v
      break;

    default: // (5)
      r = v
      g = p
      b = q
      break;
  }

  return rgbUnchecked(r * MAX_VALUE, g * MAX_VALUE, b * MAX_VALUE);
}

function bracket01(v: number): number {
  if (v < 0) {
    return 0;
  } else if (v > 1) {
    return 1;
  } else {
    return v;
  }
}

export function rgb(r: number, g: number, b: number): Color {
  return rgbUnchecked(
    bracket01(r) * MAX_VALUE,
    bracket01(g) * MAX_VALUE,
    bracket01(b) * MAX_VALUE
  );
}

export function hsv(h: number, s: number, v: number): Color {
  h = h % 360;
  if (h < 0) {
    h += 360;
  }
  return hsvUnchecked(h, bracket01(s), bracket01(v));
}
