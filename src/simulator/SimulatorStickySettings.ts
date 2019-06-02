import * as PianoVisualizations from "../portable/PianoVisualizations";

const LOCAL_STORAGE_PREFIX = "simulatorSettings:";

export interface Settings {
  sceneName: string;
  visualizationName: PianoVisualizations.Name;
  analogAudioSourceId: string | null;
  midiInputId: string | null;
  midiOutputId: string | null;
}

export function get<K extends keyof Settings>(attrs: {
  key: K,
  defaultValue: Settings[K],
  validateFunc: (value: Settings[K]) => boolean
}): Settings[K] {
  const json = (window.localStorage[LOCAL_STORAGE_PREFIX + attrs.key]) as string | undefined;
  const value = (json === undefined ? undefined : JSON.parse(json));
  if (value === undefined || !attrs.validateFunc(value)) {
    return attrs.defaultValue;
  } else {
    return value;
  }
}

export function set<K extends keyof Settings>(key: K, value: Settings[K]): void {
  window.localStorage[LOCAL_STORAGE_PREFIX + key] = JSON.stringify(value);
}