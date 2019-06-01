import * as PianoVisualizations from "../portable/PianoVisualizations";

const LOCAL_STORAGE_PREFIX = "simulatorSettings:";

export interface Settings {
  // sceneId?: string;
  visualizationName?: PianoVisualizations.Name;
  // analogAudioSourceId?: string;
  // midiInId?: string;
  // midiOutId?: string;
}

export function get<K extends keyof Settings>(key: K): Settings[K] {
  return (window.localStorage as Settings)[LOCAL_STORAGE_PREFIX + key];
}

export function set<K extends keyof Settings>(key: K, value: Settings[K]): void {
  window.localStorage[LOCAL_STORAGE_PREFIX + key] = value;
}