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

export function createBracketFunc(
  min: number,
  max: number
): (v: number) => number {
  return (v: number) => bracket(min, max, v);
}

export const bracket01 = createBracketFunc(0, 1);

export function ensureValidRange(
  startIndex: number,
  length: number,
  validLength: number
): [number, number] {
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

export function removeFirst<T>(arr: T[], item: T) {
  for (let i = 0; i < arr.length; ++i) {
    if (arr[i] === item) {
      arr.splice(i, 1);
      return;
    }
  }
}

export function removeAll<T>(arr: T[]) {
  arr.splice(0, arr.length);
}

export function forEachReverse<T>(
  arr: T[],
  func: (value: T, index: number) => void
) {
  for (let i = arr.length - 1; i >= 0; --i) {
    func(arr[i], i);
  }
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
      this.numValues++;
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

export function valueOrDefault<T>(
  valueOrUndefined: T | undefined,
  defaultValue: T
): T {
  return valueOrUndefined === undefined ? defaultValue : valueOrUndefined;
}

export function valueOrThrow<T>(valueOrUndefined: T | undefined): T {
  if (valueOrUndefined === undefined) {
    throw new Error("no value");
  }
  return valueOrUndefined;
}

export function first<T>(iterator: Iterable<T>): T {
  const it = iterator[Symbol.iterator]();
  const n = it.next();
  if (n.done) {
    throw new Error("no value");
  }
  return n.value;
}

export function firstKey<T>(map: Map<T, any>): T {
  return first(map.keys());
}

export function identity<T>(v: T): T {
  return v;
}

export function getOrCreateMap<K1, K2, V>(
  outerMap: Map<K1, Map<K2, V>>,
  outerKey: K1
): Map<K2, V> {
  let innerMap = outerMap.get(outerKey);
  if (innerMap === undefined) {
    innerMap = new Map();
    outerMap.set(outerKey, innerMap);
  }
  return innerMap;
}

export function forEachValueInSortedKeyOrder<V>(
  map: Map<string, V>,
  func: (value: V) => void
) {
  Array.from(map.keys())
    .sort()
    .forEach(k => {
      func(map.get(k) as V);
    });
}
