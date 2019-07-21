import * as Visualization from "./base/Visualization";

import { valueOrThrow } from "../util/Utils";

export interface VisualizationRegistry {
  readonly groupNames: ReadonlyArray<string>;
  visualizationNamesInGroup(groupName: string): ReadonlyArray<string>;
  createVisualization(visualizationName: string, config: Visualization.Config): Visualization.default;
}

export class VisualizationRegistryFactory {
  private readonly registry = new VisualizationRegistryImpl();
  private built = false;

  public build(): VisualizationRegistry {
    this.built = true;
    return this.registry;
  }

  public add(factory: Visualization.Factory) {
    if (this.built) {
      throw new Error("can't add after registry has been built");
    }
    this.registry.add(factory);
  }
}

class VisualizationRegistryImpl implements VisualizationRegistry {
  private readonly groupedNames: Map<string, string[]> = new Map();
  private readonly flatMap: Map<string, Visualization.Factory> = new Map();
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
    const factory = valueOrThrow(this.flatMap.get(visualizationName));
    return factory.create(config);
  }

  public add(factory: Visualization.Factory) {
    // clear caches
    this.cachedGroupNames = undefined;

    const groupName = "<default>";
    const name = factory.name;

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
    this.flatMap.set(name, factory);
  }
}