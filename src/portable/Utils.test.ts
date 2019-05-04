import * as Utils from "./Utils";

it("floatToString", () => {
  expect(Utils.floatToString(0, 0)).toBe("0");
  expect(Utils.floatToString(0, 1)).toBe("0.0");
  expect(Utils.floatToString(0.5, 2)).toBe("0.50");
  expect(Utils.floatToString(-123.5, 2)).toBe("-123.50");
  expect(Utils.floatToString(-123.5, 2)).toBe("-123.50");
  expect(Utils.floatToString(123.44, 1)).toBe("123.4");
  expect(Utils.floatToString(123.45, 1)).toBe("123.5");
  expect(Utils.floatToString(-123.45, 1)).toBe("-123.4");
  expect(Utils.floatToString(-123.46, 1)).toBe("-123.5");
});
