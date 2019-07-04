import FancyValue from "./FancyValue";

it("decay exponential", () => {
  const v = new FancyValue(1);
  expect(v.value).toBe(1);

  v.decayExponential(1, 1);
  expect(v.value).toBeCloseTo(0.5);
  v.decayExponential(1, 1);
  expect(v.value).toBeCloseTo(0.25);

  v.value = 1;
  v.decayExponential(1, 0.5);
  v.decayExponential(1, 0.5);
  expect(v.value).toBeCloseTo(0.5);

  v.value = 50;
  v.decayExponential(2, 0.5);
  v.decayExponential(2, 1.5);
  expect(v.value).toBeCloseTo(25);
});
