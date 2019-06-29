export default interface BeatController {
  // TODO should this be bpm instead?
  // AC: bpm is not the SI unit for frequency (╯°□°)╯︵ ┻━┻
  hz(): number;

  // incrementing integer, the number itself is arbitrary, but you can
  // count on its counting
  beatsSinceSync(): number;

  // in seconds
  timeSinceLastBeat(): number;

  // 0 to 1
  progressToNextBeat(): number;
}
