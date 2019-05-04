import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization, { State } from "../base/PianoVisualization";

const TAIL_LENGTH_CONST = 0.02;

interface Info {
    time: number;
    velocity: number;
    randomHue: number;
}

interface SparkleInfo {
    value: number;
    led: number;
}

function randomHue() {
    return Math.floor(Math.random() * 360);
}

export default class CenterSpreadVisualization extends PianoVisualization {
    private info = new Array<Info>();
    private sparkles = new Array<SparkleInfo>();
    private time = 0;
    private keyToHue = new Array<number>();

    constructor(ledStrip: LedStrip) {
        super(ledStrip);
        ledStrip.reset(Colors.BLACK);
        for(let i = 0; i < 88; ++i) {
            this.keyToHue[i] = randomHue();
        }
    }

    public render(elapsedMillis: number, state: State): void {
        this.time += elapsedMillis;

        this.info = this.info.filter(kt => kt.time - this.time < 1000);

        let sumVelocity = 0;
        for (const key of state.changedKeys) {
            if (state.keys[key]) {
                sumVelocity += state.keyVelocities[key];
            }
        }
        if (sumVelocity > 0) {
            this.info.push({time: this.time, velocity: Math.min(1, sumVelocity), randomHue: randomHue()});
        }

        const colors = new Array<Colors.Color>(this.ledStrip.size).fill(Colors.BLACK);

        // main reaction to key press by placing random colors spreading from the center
        for (const kt of this.info) {
            const elapsed = this.time - kt.time;
            const idx = Math.round((elapsed / 1000.0) * (this.ledStrip.size / 2));

            const hi = idx + this.ledStrip.size / 2;
            let brightness = 1;
            for (let i = hi; i >= this.ledStrip.size / 2 && brightness > 0; --i) {
                const c = Colors.hsv(kt.randomHue, 1, brightness);
                brightness -= TAIL_LENGTH_CONST / kt.velocity;
                colors[i] = Colors.add(c, colors[i]);
            }

            const lo = this.ledStrip.size / 2 - idx;
            brightness = 1;
            for (let i = lo; i <= this.ledStrip.size / 2 && brightness > 0; ++i) {
                const c = Colors.hsv(kt.randomHue, 1, brightness);
                brightness -= TAIL_LENGTH_CONST/ kt.velocity;
                colors[i] = Colors.add(c, colors[i]);
            }
        }

        // add dem sparkles dat we luv
        this.sparkles = this.sparkles.filter(si => si.value > 0);
        for (let i = 0; i < colors.length; ++i) {
            const rgb = Colors.split(colors[i]);
            const v = Math.max(rgb[0], rgb[1], rgb[2]);
            if (v > 0 && Math.random() < 0.02 && this.sparkles.findIndex(si => si.led === i) < 0) {
                this.sparkles.push({value: v, led: i});
            }
        }
        for (const si of this.sparkles) {
            const sparkleColor = Colors.hsv(randomHue(), Math.random()*0.25, si.value);
            colors[si.led] = Colors.add(colors[si.led], sparkleColor);
            si.value -= 0.03;
        }

        // write colors
        colors.forEach((c, i) => {
            this.ledStrip.setColor(i, c);
        });
    }
}
