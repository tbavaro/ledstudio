export default class Recycler<T> {
  private readonly deadObjects: T[];
  private readonly objectCreator: () => T;

  constructor(objectCreator: () => T) {
    this.deadObjects = [];
    this.objectCreator = objectCreator;
  }

  public getOrCreate(): T {
    return this.deadObjects.pop() || this.objectCreator();
  }

  public recycle(object: T) {
    this.deadObjects.push(object);
  }
}
