import BeatController from "./BeatController";

const URL = "ws://localhost:17001";
const RECONNECT_TIME_MS = 3000;

export default class AbletonLinkConnect implements BeatController {
    private static instance: Implementation;

    constructor() {
        if (AbletonLinkConnect.instance == null) {
            AbletonLinkConnect.instance = new Implementation();
        }
    }

    public hz() {
        return AbletonLinkConnect.instance.getHz();
    }

    public beatsSinceSync() {
        return AbletonLinkConnect.instance.beatsSinceSync();
    }

    public timeSinceLastBeat() {
        return AbletonLinkConnect.instance.timeSinceLastBeat();

    }

    public progressToNextBeat() {
        return AbletonLinkConnect.instance.progressToNextBeat();
    }
}

class Implementation {

    private ws: WebSocket | null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private hz: number = 120;
    private aBeatTime: number = 0;

    constructor() {
        this.tryConnectNow();
    }

    private tryConnectNow = () => {
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws == null) {
            this.ws = new WebSocket(URL);
            this.ws.onopen = this.onWebSocketOpen;
            this.ws.onclose = this.onWebSocketClose;
            this.ws.onmessage = this.onLinkMessage;
        }
    }

    private tryConnectSoon() {
        if (this.reconnectTimeout === null) {
            this.reconnectTimeout = setTimeout(this.tryConnectNow, RECONNECT_TIME_MS);
        }
    }

    private onWebSocketOpen = () => {
        console.log("ableton link websocket open");
    }

    private onWebSocketClose = (ev: CloseEvent) => {
        console.log("ableton link websocket closed");
        if (ev.target === this.ws) {
            this.ws = null;
            this.tryConnectSoon();
        }
    }

    private onLinkMessage = (ev: MessageEvent) => {
        if (ev.target === this.ws) {
            const blob = ev.data as Blob;
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                const lines = text.split("\n");
                // looking for lines that look like this
                // status { :peers 0 :bpm 120.000000 :start 73743731220 :beat 597.737570 }
                for (const l of lines) {
                    const match = l.match(/status { :peers ([0-9]+) :bpm ([0-9.]+) :start ([0-9.]+) :beat ([0-9.]+)/);
                    if (match == null) {
                        continue;
                    }
                    this.hz = parseFloat(match[2]) / 60;
                    let beat = parseFloat(match[4]);
                    beat -= Math.floor(beat);
                    this.aBeatTime = nowInSeconds() - (beat / this.hz);
                }
            };
            reader.readAsText(blob);
        }
    }

    public getHz() {
        return this.hz;
    }

    public timeSinceLastBeat() {
        const lag = nowInSeconds() - this.aBeatTime;
        const period = 1 / this.hz;
        const beats = Math.floor(lag / period);
        const offset = lag - beats * period;
        return offset;
    }

    public progressToNextBeat() {
        const lag = nowInSeconds() - this.aBeatTime;
        const period = 1 / this.hz;
        const beats = lag / period;
        return beats - Math.floor(beats);
    }

    public beatsSinceSync() {
        const lag = nowInSeconds() - this.aBeatTime;
        const period = 1 / this.hz;
        const beats = Math.floor(lag / period);
        return beats;
    }
}

function nowInSeconds() {
    return Date.now() / 1000;
}
