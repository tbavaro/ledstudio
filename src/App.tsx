import * as React from "react";
import LedStudioRoot from "./LedStudioRoot";
import * as Visualizations from "./portable/Visualizations";
import * as Scenes from "./scenes/Scenes";

export default class App extends React.PureComponent<{}, {}> {
  public render() {
    return (
      <LedStudioRoot
        scenes={Scenes.registry}
        visualizations={Visualizations.registry}
      />
    );
  }
}
