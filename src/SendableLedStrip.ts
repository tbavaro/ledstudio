import LedStrip from "./portable/base/LedStrip";

// most uses of LedStrip don't need to worry about this, but the actual
// terminal LED strips need a way to flush/send their data. Specifically,
// visualizations should not need to call this themselves.
export interface SendableLedStrip extends LedStrip {
  send(): void;
}
