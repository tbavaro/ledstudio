import FixedArray from "./FixedArray";

it("FixedArray.copy empty to empty", () => {
  const target = FixedArray.from<number>([]);
  const source = FixedArray.from<number>([]);
  source.copy(target);
  expect(target.toArray()).toEqual([]);
});

it("FixedArray.copy basic", () => {
  const target = FixedArray.from<number>([1, 2, 3]);
  const source = FixedArray.from<number>([4, 5, 6]);
  source.copy(target);
  expect(target.toArray()).toEqual([4, 5, 6]);
});

it("FixedArray.copy partial", () => {
  const target = FixedArray.from<number>([1, 2, 3]);
  const source = FixedArray.from<number>([4, 5, 6]);
  source.copy(target, 0, 0, 2);
  expect(target.toArray()).toEqual([4, 5, 3]);
});

it("FixedArray.copy before beginning", () => {
  const target = FixedArray.from<number>([1, 2, 3]);
  const source = FixedArray.from<number>([4, 5, 6]);
  source.copy(target, -1, 0);
  expect(target.toArray()).toEqual([5, 6, 3]);
});

it("FixedArray.copy all before beginning", () => {
  const target = FixedArray.from<number>([1, 2, 3]);
  const source = FixedArray.from<number>([4, 5, 6]);
  source.copy(target, -4, 0);
  expect(target.toArray()).toEqual([1, 2, 3]);
});

it("FixedArray.copy past end", () => {
  const target = FixedArray.from<number>([1, 2, 3]);
  const source = FixedArray.from<number>([4, 5, 6]);
  source.copy(target, 2, 0);
  expect(target.toArray()).toEqual([1, 2, 4]);
});

it("FixedArray.copy start past end", () => {
  const target = FixedArray.from<number>([1, 2, 3]);
  const source = FixedArray.from<number>([4, 5, 6]);
  source.copy(target, 5, 0);
  expect(target.toArray()).toEqual([1, 2, 3]);
});
