export class FancyValue {
  public value: number;

  constructor(initialValue?: number) {
    this.value = (initialValue === undefined ? 0 : initialValue);
  }

  public decayLinearAmount(amount: number) {
    this.value = Math.max(0, this.value - amount);
    return this.value;
  }

  public decayLinearRate(rate: number, interval: number) {
    return this.decayLinearAmount(rate * interval);
  }

  public decayHalfLife(halflife: number, interval: number) {

  }

  public bumpTo(value: number) {
    if (value > this.value) {
      this.value = value;
    }
  }
}