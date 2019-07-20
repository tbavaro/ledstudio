import * as React from "react";
import LedStudioRoot from "./LedStudioRoot";
import * as Visualizations from "./portable/Visualizations";
import * as Scenes from "./scenes/Scenes";

export default class App extends React.PureComponent<{}, {}> {
  public render() {
    const midiFiles = [
      "abovo.mid",
      "thegift.mid",
      "bach_846.mid",
      "beethoven_opus10_2.mid",
      "chpn_op27_1.mid",
      "chpn_op66.mid",
      "grieg_zwerge.mid"
    ];

    return (
      <LedStudioRoot
        midiFiles={midiFiles}
        scenes={Scenes.registry}
        visualizations={Visualizations.registry}
      />
    );
  }
}
