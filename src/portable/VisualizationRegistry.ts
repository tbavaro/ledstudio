import * as Visualization from "./base/Visualization";

import { valueOrThrow } from "../util/Utils";

export interface VisualizationRegistry {
  readonly groupNames: ReadonlyArray<string>;
  visualizationNamesInGroup(groupName: string): ReadonlyArray<string>;
  createVisualization(visualizationName: string, config: Visualization.Config): Visualization.default;
}

export class VisualizationRegistryBuilder {
  private readonly registry = new VisualizationRegistryImpl();
  private built = false;

  public build(): VisualizationRegistry {
    this.built = true;
    return this.registry;
  }

  public add(groupName: string, name: string, ctor: Visualization.Constructor) {
    if (this.built) {
      throw new Error("can't add after registry has been built");
    }
    this.registry.add(groupName, name, ctor);
  }
}

class VisualizationRegistryImpl implements VisualizationRegistry {
  private readonly groupedNames: Map<string, string[]> = new Map();
  private readonly flatMap: Map<string, Visualization.Constructor> = new Map();
  private cachedGroupNames: string[] | undefined;
  
  public get groupNames() {
    if (this.cachedGroupNames === undefined) {
      this.cachedGroupNames = Array.from(this.groupedNames.keys());
    }
    return this.cachedGroupNames;
  }

  public visualizationNamesInGroup(groupName: string) {
    return valueOrThrow(this.groupedNames.get(groupName));
  }

  public createVisualization(visualizationName: string, config: Visualization.Config) {
    const ctor = valueOrThrow(this.flatMap.get(visualizationName));
    return new ctor(config);
  }

  public add(groupName: string, name: string, ctor: Visualization.Constructor) {
    // clear caches
    this.cachedGroupNames = undefined;

    // ensure this vis name is globally unique
    if (this.flatMap.has(name)) {
      throw new Error(`tried to add multiple visualizations named "${name}"`);
    }

    // add to group
    let visNamesInGroup = this.groupedNames.get(groupName);
    if (visNamesInGroup === undefined) {
      visNamesInGroup = [];
      this.groupedNames.set(groupName, visNamesInGroup);
    }
    visNamesInGroup.push(name);

    // add
    this.flatMap.set(name, ctor);
  }
}