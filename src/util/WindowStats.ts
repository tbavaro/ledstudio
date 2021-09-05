function identity<T>(v: T): T {
  return v;
}

export class CircularQueue<T> {
  private readonly maxSize: number;
  private readonly values: T[];
  private nextIndex: number;
  private sizeUnsafe: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.values = new Array(maxSize).fill(undefined);
    this.nextIndex = 0;
    this.sizeUnsafe = 0;
  }

  public get size() {
    return this.sizeUnsafe;
  }

  public push(v: T): T | undefined {
    const i = this.nextIndex;
    this.nextIndex = (this.nextIndex + 1) % this.maxSize;
    const oldValue = this.values[i];
    if (this.sizeUnsafe < this.maxSize) {
      this.sizeUnsafe += 1;
    }
    this.values[i] = v;
    return oldValue;
  }

  public forEach(func: (v: T) => void) {
    let i = this.nextIndex - this.sizeUnsafe;
    if (i < 0) {
      i += this.maxSize;
    }
    for (let n = 0; n < this.sizeUnsafe; ++n) {
      func(this.values[i]);
      i = i + 1;
      if (i >= this.maxSize) {
        i = 0;
      }
    }
  }

  public reduce<U>(callbackfn: (prevAccum: U, v: T) => U, initialAccum: U): U {
    let accum = initialAccum;
    this.forEach(
      (currentValue: T) => (accum = callbackfn(accum, currentValue))
    );
    return accum;
  }

  public sum(func: (v: T) => number): number {
    let accum = 0;
    this.forEach(v => (accum += func(v)));
    return accum;
  }
}

// TODO optimize but keep numerical stability
export default class WindowStats {
  private readonly values: CircularQueue<number>;
  private cachedMean: number | undefined;
  private cachedVariance: number | undefined;

  constructor(maxWindowSize: number) {
    this.values = new CircularQueue(maxWindowSize);
  }

  public push(v: number) {
    const oldValue = this.values.push(v);
    this.cachedMean = undefined;
    this.cachedVariance = undefined;
    return oldValue;
  }

  public get size() {
    return this.values.size;
  }

  public get mean() {
    // NB: reference implementation; needs optimization

    if (this.cachedMean === undefined) {
      this.cachedMean = this.values.sum(identity) / this.size;
    }

    return this.cachedMean;
  }

  public get variance() {
    // NB: reference implementation; needs optimization

    if (this.cachedVariance === undefined) {
      switch (this.size) {
        case 0:
          return NaN;
        case 1:
          return 0;
        default:
          break;
      }

      const mean = this.mean;
      this.cachedVariance =
        this.values.sum(v => {
          const d = v - mean;
          return d * d;
        }) /
        (this.size - 1);
    }

    return this.cachedVariance;
  }

  public get stddev() {
    return Math.sqrt(this.variance);
  }

  public get max() {
    let best = NaN;
    this.values.forEach(v => {
      if (isNaN(best) || v > best) {
        best = v;
      }
    });
    return best;
  }

  public get min() {
    let best = NaN;
    this.values.forEach(v => {
      if (isNaN(best) || v < best) {
        best = v;
      }
    });
    return best;
  }

  public zScore(v: number) {
    return (v - this.mean) / this.stddev;
  }
}
