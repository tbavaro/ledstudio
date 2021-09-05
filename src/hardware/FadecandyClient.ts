const URL = "ws://localhost:7890";

const RECONNECT_TIME_MS = 3000;

export default class FadecandyClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.tryConnectNow();
  }

  private tryConnectNow = () => {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws === null) {
      this.ws = new WebSocket(URL);
      this.ws.onopen = this.onWebSocketOpen;
      this.ws.onclose = this.onWebSocketClose;
    }
  };

  private tryConnectSoon() {
    if (this.reconnectTimeout === null) {
      this.reconnectTimeout = setTimeout(this.tryConnectNow, RECONNECT_TIME_MS);
    }
  }

  public sendData(data: Buffer) {
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  private onWebSocketOpen = () => {
    console.log("fadecandy websocket opened");
  };

  private onWebSocketClose = (ev: CloseEvent) => {
    console.log("fadecandy websocket closed");
    if (ev.target === this.ws) {
      this.ws = null;
      this.tryConnectSoon();
    }
  };
}
