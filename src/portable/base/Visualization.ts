export default abstract class Visualization<S> {
  public abstract render(elapsedMillis: number, state: S): void;
}
