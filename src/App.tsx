import * as React from "react";

import * as Visualizations from "./generated/Visualizations";
import LedStudioRoot from "./LedStudioRoot";
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
