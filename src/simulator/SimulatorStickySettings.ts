import * as Visualizations from "../portable/Visualizations";

const LOCAL_STORAGE_PREFIX = "simulatorSettings:";

export interface Settings {
  sceneName: string;
  visualizationName: Visualizations.Name;
  analogAudioSourceId: string | null;
  midiInputId: string | null;
  midiControllerInputId: string | null;
  midiOutputId: string | null;
  midiFilename: string;
  simulationEnabled: boolean;
}

export function get<K extends keyof Settings>(attrs: {
  key: K,
  defaultValue: Settings[K],
  validateFunc?: (value: Settings[K]) => boolean
}): Settings[K] {
  const json = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + attrs.key) as string | null;
  const value = (json === null ? undefined : JSON.parse(json));
  if (value === undefined || (attrs.validateFunc !== undefined && !attrs.validateFunc(value))) {
    return attrs.defaultValue;
  } else {
    return value;
  }
}

export function set<K extends keyof Settings>(key: K, value: Settings[K]): void {
  window.localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
}