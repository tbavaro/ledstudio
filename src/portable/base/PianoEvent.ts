export type Type = "keyPressed" | "keyReleased";
export type Key = number;  // 0-87

type PianoEvent = {
  readonly type: Type;
} & {
  readonly type: "keyPressed" | "keyReleased"
  readonly key: Key;
  readonly velocity: number;
};
export default PianoEvent;
