import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

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

export default class CenterSpreadVisualization extends Visualization.SingleRowVisualization {
    private info = new Array<Info>();
    private sparkles = new Array<SparkleInfo>();
    private time = 0;
    private keyToHue = new Array<number>();

    constructor(scene: Scene) {
        super(scene, Math.max.apply(Math, scene.leds.map(row => row.length)));
        for(let i = 0; i < this.leds.length; ++i) {
            this.keyToHue[i] = randomHue();
        }
    }

    public renderSingleRow(elapsedMillis: number, state: Visualization.State): void {
        const { pianoState } = state;

        this.time += elapsedMillis;

        this.info = this.info.filter(kt => kt.time - this.time < 1000);

        let sumVelocity = 0;
        for (const key of pianoState.changedKeys) {
            if (pianoState.keys[key]) {
                sumVelocity += pianoState.keyVelocities[key];
            }
        }
        if (sumVelocity > 0) {
            this.info.push({time: this.time, velocity: Math.min(1, sumVelocity), randomHue: randomHue()});
        }

        this.leds.fill(Colors.BLACK);

        // main reaction to key press by placing random colors spreading from the center
        for (const kt of this.info) {
            const elapsed = this.time - kt.time;
            const idx = Math.round((elapsed / 1000.0) * (this.leds.length / 2));

            const hi = idx + this.leds.length / 2;
            let brightness = 1;
            for (let i = hi; i >= this.leds.length / 2 && brightness > 0; --i) {
                const c = Colors.hsv(kt.randomHue, 1, brightness);
                brightness -= TAIL_LENGTH_CONST / kt.velocity;
                if (i < this.leds.length) {
                    this.leds.add(i, c);
                }
            }

            const lo = this.leds.length / 2 - idx;
            brightness = 1;
            for (let i = lo; i <= this.leds.length / 2 && brightness > 0; ++i) {
                const c = Colors.hsv(kt.randomHue, 1, brightness);
                brightness -= TAIL_LENGTH_CONST/ kt.velocity;
                this.leds.add(i, c);
            }
        }

        // add dem sparkles dat we luv
        this.sparkles = this.sparkles.filter(si => si.value > 0);
        for (let i = 0; i < this.leds.length; ++i) {
            const rgb = Colors.split(this.leds.get(i));
            const v = Math.max(rgb[0], rgb[1], rgb[2]);
            if (v > 0 && Math.random() < 0.02 && this.sparkles.findIndex(si => si.led === i) < 0) {
                this.sparkles.push({value: v, led: i});
            }
        }
        for (const si of this.sparkles) {
            const sparkleColor = Colors.hsv(randomHue(), Math.random()*0.25, si.value);
            this.leds.add(si.led, sparkleColor);
            si.value -= 0.03;
        }
    }
}
