export default class FancyValue {
  public value: number;

  constructor(initialValue?: number) {
    this.value = (initialValue === undefined ? NaN : initialValue);
  }

  public decayLinearAmount(amount: number) {
    this.value = Math.max(0, this.value - amount);
    return this.value;
  }

  public decayLinearRate(rate: number, interval: number) {
    return this.decayLinearAmount(rate * interval);
  }

  public decayExponential(halfLife: number, interval: number) {
    this.value *= Math.pow(0.5, interval / halfLife);
    return this.value;
  }

  public bumpTo(value: number) {
    if (value > this.value) {
      this.value = value;
    }
  }
}