export default class FixedArray<T> {
  private readonly items: T[];

  public static from<T>(arr: T[]): FixedArray<T> {
    return new this(arr.length, i => arr[i]);
  }

  public static ofValue<T>(length: number, value: T): FixedArray<T> {
    return new this(length, _ => value);
  }

  public constructor(length: number, initializer: (i: number) => T) {
    this.items = new Array<T>(length);
    for (let i = 0; i < length; ++i) {
      this.items[i] = initializer(i);
    }
  }

  public get length() {
    return this.items.length;
  }

  public get(i: number) {
    if (i < 0 || i >= this.items.length) {
      throw new Error(`invalid index: ${i}`);
    }
    return this.items[i];
  }

  public getOr<T2>(i: number, or: T): (T | T2) {
    if (i < 0 || i >= this.items.length) {
      return or;
    }
    return this.items[i];
  }

  public set(i: number, value: T, strict?: boolean) {
    if (i < 0 || i >= this.items.length) {
      if (strict) {
        throw new Error(`invalid index: ${i}`);
      }
    } else {
      this.items[i] = value;
    }
  }

  public fill(value: T) {
    this.items.fill(value);
  }

  public map<V>(func: (value: T) => V): V[] {
    return this.items.map(func);
  }

  public forEach(func: (value: T, i: number) => void) {
    this.items.forEach(func);
  }

  public toString() {
    return this.items.toString();
  }

  // don't allow direct indexing
  [n: number]: { __invalid: never };
}