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

export function bracket(min: number, max: number, v: number) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

export function createBracketFunc(min: number, max: number): (v: number) => number {
  return (v: number) => bracket(min, max, v);
}

export const bracket01 = createBracketFunc(0, 1);

export function ensureValidRange(startIndex: number, length: number, validLength: number): [number, number] {
  if (startIndex < 0) {
    length += startIndex;
    startIndex = 0;
  }

  length = Math.min(length, validLength - startIndex);

  return [startIndex, length];
}

export function pushAll<T>(arr: T[], items: T[]) {
  items.forEach(item => arr.push(item));
}

export class MovingAverageHelper {
  private readonly values: number[];
  private numValues: number = 0;
  private sum: number = 0;
  private nextIndex: number = 0;

  constructor(size: number) {
    this.values = new Array(size);
  }

  public get movingAverage() {
    return this.sum / this.numValues;
  }

  public addValue(value: number) {
    if (this.numValues === this.values.length) {
      this.sum -= this.values[this.nextIndex];
    } else {
      this.numValues ++;
    }
    this.values[this.nextIndex] = value;
    this.sum += value;
    this.nextIndex = (this.nextIndex + 1) % this.values.length;
  }

  public addTiming<T>(func: () => T): T {
    const startTime = performance.now();
    try {
      return func();
    } finally {
      this.addValue(performance.now() - startTime);
    }
  }
}

export function roundPlaces(v: number, numPlaces: number) {
  const factor = Math.pow(10, numPlaces);
  return Math.round(v * factor) / factor;
}
