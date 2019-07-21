import * as React from "react";
import LedStudioRoot from "./LedStudioRoot";
import * as Scenes from "./scenes/Scenes";

import * as Visualizations from "./generated/Visualizations";

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
