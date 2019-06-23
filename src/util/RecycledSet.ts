import Recycler from "./Recycler";
import { forEachReverse } from "./Utils";

export default interface RecycledSet<T> {
  // adds a new object and returns it so you can set its values
  add(): T;

  // removes (and recycles) the given object
  remove(object: T): void;

  // iterates over all the objects; if `func` returns `false` the object will be
  // removed. Implementations are allowed to wait until all objects are visited
  // to actually remove any.
  forEachAndFilter(func: (object: T) => boolean): void;

  readonly size: number;
}

export class UnorderedRecycledSet<T> implements RecycledSet<T> {
  private readonly recycler: Recycler<T>;
  private readonly liveObjects: T[];
  private readonly deadObjects: T[];

  public static withObjectCreator<T>(objectCreator: () => T) {
    return new UnorderedRecycledSet(new Recycler(objectCreator));
  }

  constructor(recycler: Recycler<T>) {
    this.recycler = recycler;
    this.liveObjects = [];
    this.deadObjects = [];
  }

  public add(): T {
    const object = this.recycler.getOrCreate();
    this.liveObjects.push(object);
    return object;
  }

  private removeAtIndex(index: number) {
    const object = this.liveObjects[index];
    const lastObject = this.liveObjects.pop() as T;
    if (object !== lastObject) {
      this.liveObjects[index] = lastObject;
    }
    this.deadObjects.push(object);
  }

  public remove(object: T) {
    const index = this.liveObjects.findIndex(v => v === object);
    if (index !== -1) {
      this.removeAtIndex(index);
    }
  }

  public forEachAndFilter(func: (object: T) => boolean): void {
    const deadIndexes: number[] = [];
    this.liveObjects.forEach((object, index) => {
      const keep = func(object);
      if (!keep) {
        deadIndexes.push(index);
      }
    });
    forEachReverse(deadIndexes, i => this.removeAtIndex(i));
  }

  public get size() {
    return this.liveObjects.length;
  }
}
