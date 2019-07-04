import WindowStats from "./WindowStats";

it("mean of no values", () => {
  const ws = new WindowStats(0);
  expect(ws.mean).toEqual(NaN);
});

it("mean of 1 value", () => {
  const ws = new WindowStats(1);
  ws.push(123);
  expect(ws.mean).toBeCloseTo(123);
});

it("mean of 2 values", () => {
  const ws = new WindowStats(2);
  ws.push(1);
  ws.push(2);
  expect(ws.mean).toBeCloseTo(1.5);
});

it("mean of 2 values with size 1", () => {
  const ws = new WindowStats(1);
  ws.push(1);
  ws.push(2);
  expect(ws.mean).toBeCloseTo(2);
});

it("variance of no values", () => {
  const ws = new WindowStats(0);
  expect(ws.variance).toEqual(NaN);
});

it("variance of 1 value", () => {
  const ws = new WindowStats(1);
  ws.push(1);
  expect(ws.variance).toBeCloseTo(0);
});

it("variance of 2 equal value", () => {
  const ws = new WindowStats(2);
  ws.push(1);
  ws.push(1);
  expect(ws.variance).toBeCloseTo(0);
});

it("variance of 2 unequal values", () => {
  const ws = new WindowStats(2);
  ws.push(1);
  ws.push(2);
  expect(ws.variance).toBeCloseTo(0.5);
});

it("variance of 3 unequal values", () => {
  const ws = new WindowStats(3);
  ws.push(1);
  ws.push(2);
  ws.push(3);
  expect(ws.variance).toBeCloseTo(1);
});

it("variance of 3 unequal values using size 2", () => {
  const ws = new WindowStats(2);
  ws.push(1);
  ws.push(2);
  ws.push(3);
  expect(ws.variance).toBeCloseTo(0.5);
});
