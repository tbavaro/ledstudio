export function fillArray<T>(size: number, func: (index: number) => T): T[] {
  const output = new Array<T>(size);
  for (let i = 0; i < size; ++i) {
    output[i] = func(i);
  }
  return output;
}

export function updateValues<T>(arr: T[], func: (oldValue: T) => T) {
  for (let i = 0; i < arr.length; ++i) {
    arr[i] = func(arr[i]);
  }
}

export function floatToString(n: number, precision: number): string {
  if (precision === 0) {
    return `${Math.round(n)}`;
  }
  const roundAdjustment = Math.pow(10, precision);
  n = Math.round(n * roundAdjustment) / roundAdjustment;

  // tslint:disable-next-line: prefer-const
  let [intPart, fracPart] = `${n}`.split(".");
  if (fracPart === undefined) {
    fracPart = "";
  } else {
    fracPart = fracPart.slice(0, precision);
  }
  while (fracPart.length < precision) {
    fracPart += "0";
  }
  return `${intPart}.${fracPart}`;
}

export function createBracketFunc(min: number, max: number): (v: number) => number {
  return (v: number) => {
    if (v < min) {
      return min;
    } else if (v > max) {
      return max;
    } else {
      return v;
    }
  };
}

export const bracket01 = createBracketFunc(0, 1);
