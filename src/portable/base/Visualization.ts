import LedStrip from "./LedStrip";

export default abstract class Visualization<S> {
  protected readonly ledStrip: LedStrip;

  constructor(ledStrip: LedStrip) {
    this.ledStrip = ledStrip;
  }

  public abstract render(elapsedMillis: number, state: S): void;
}
