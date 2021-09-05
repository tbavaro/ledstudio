export type Type = "keyPressed" | "keyReleased";
export type Key = number; // 0-87

type PianoEvent = {
  readonly type: Type;
} & {
  readonly type: "keyPressed" | "keyReleased";
  readonly key: Key; // 0 to 87
  readonly velocity: number; // 0 to 1
};
export default PianoEvent;
