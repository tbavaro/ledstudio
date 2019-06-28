export default interface BeatController {
  // TODO should this be bpm instead?
  hz(): number;

  // TODO what's the semantic meaning here?
  // NB: is number of full beats (ie integer)
  beatsSinceSync(): number;

  // in seconds
  timeSinceLastBeat(): number;

  // 0 to 1
  progressToNextBeat(): number;
}
