import * as React from "react";

import "./VisualizerExtraDisplayContainer.css";

interface Props {
  element: HTMLElement;
}

interface State {
  currentElement: HTMLElement | null;
  currentRef: HTMLDivElement | null;
}

export default class VisualizerExtraDisplayContainer extends React.PureComponent<Props, State> {
  public state: State = {
    currentElement: null,
    currentRef: null
  };

  public static getDerivedStateFromProps(nextProps: Readonly<Props>, prevState: State): Partial<State> {
    const ref = prevState.currentRef;
    if (ref !== null) {
      if (nextProps.element !== prevState.currentElement) {
        if (prevState.currentElement !== null) {
          ref.removeChild(prevState.currentElement);
        }
        ref.appendChild(nextProps.element);
      }
    }

    return {
      currentElement: nextProps.element
    };
  }

  public render() {
    return (
      <div className="VisualizerExtraDisplayContainer" ref={this.setRef}/>
    );
  }

  private setRef = (newRef: HTMLDivElement | null) => {
    if (this.state.currentRef !== null && this.state.currentElement !== null) {
      this.state.currentRef.removeChild(this.state.currentElement);
    }
    if (newRef !== null && this.state.currentElement !== null) {
      newRef.appendChild(this.props.element);
    }
    this.setState({ currentRef: newRef });
  }
}
