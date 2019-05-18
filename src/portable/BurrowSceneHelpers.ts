
import ColorRow from "./base/ColorRow";

export function copyWithDerez(from: ColorRow, to: ColorRow, derezAmount: number) {
  if (to.length !== from.length) {
    throw new Error("expected 'to' to be a the same length as 'from'");
  }

  for (let i = 0; i < from.length; ++i) {
    if (Math.random() > derezAmount) {
      to.set(i, from.get(i));
    }
  }
}
