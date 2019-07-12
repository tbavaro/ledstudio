import { bracket01 } from "../../util/Utils";
import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import { Signals } from "./util/SignalsHelper";
import { randomPalette } from "./util/Utils";

const NAME = "expandingDashes";

class ExpandingDashesVisualization extends Visualization.default {

    private regularPalette: Colors.Color[];
    private dropPalette: Colors.Color[];
    private readonly wingDashPaires: number[];
    private readonly wingDashPairRatioes: number[];
    private readonly ezTS: Visualization.EasyTimeSeriesValueSetters;
    private readonly signals: Signals;
    private readonly colorOffset: number;
    private lastPaletteSwap: number;

    constructor(config: Visualization.Config) {
        super(config);
        this.swapPalettes();
        this.colorOffset = this.colorOffset = Math.floor(Math.random() * 3 + 1);
        this.wingDashPaires = [0, 0, 0, 0].map(_ => Math.round(Math.random() * 3) + 3);
        this.wingDashPairRatioes = [0.66, 0.34, 0.34, 0.66];

        this.ezTS = config.createEasyTimeSeriesSet();
        this.signals = config.signals;
    }

    public render(context: Visualization.FrameContext): void {
        if (Date.now() - this.lastPaletteSwap > 30000 && this.signals.soundsLikeStrongBeat) {
            this.swapPalettes();
        }

        this.ledRows.forEach(r => r.fill(Colors.BLACK));

        this.ezTS.white.value = this.signals.beatsWithBeats.sum(x => x) / 8;
        this.ezTS.red.value = this.signals.audioValues.lowRMSZScore20 / 4;
        this.ezTS.green.value = this.signals.lowLevel;
        this.ezTS.orange.value = this.signals.audioValues.lowRMSEMA20 * 4;


        const inDropAfterGlow = this.signals.beatsSinceDrop < 16;
        this.ledRows.forEach((row, rowIdx) => {
            const wingRowLength = row.length / 2;
            const wingRowDashPaires = this.wingDashPaires[rowIdx];
            const ledsPerDashPair = Math.floor(wingRowLength / wingRowDashPaires);
            const rowOffset = Math.floor((wingRowLength - ledsPerDashPair * wingRowDashPaires) / 2);
            for (let i = 0; i < wingRowDashPaires; ++i) {
                const dashPairStart = Math.round(rowOffset + i * ledsPerDashPair);
                const firstDashStart = dashPairStart;
                const ledsInFirstDash = Math.round(ledsPerDashPair * this.wingDashPairRatioes[rowIdx]);
                const firstDashLevel = fudgingFunction(rowIdx % 2 === 0 ? this.signals.lowLevel : this.signals.highLevel);
                const firstDashColorIdx = !inDropAfterGlow ? rowIdx+i + this.colorOffset : 0;
                const firstDashLeftColor = this.randomColor(firstDashColorIdx, inDropAfterGlow);
                const firstDashRightColor = this.randomColor(firstDashColorIdx, inDropAfterGlow);
                this.renderDash(firstDashStart, ledsInFirstDash, firstDashLevel, firstDashLeftColor, firstDashRightColor, row);

                const secondDashStart = firstDashStart + ledsInFirstDash;
                const ledsInSecondDash = ledsPerDashPair - ledsInFirstDash;
                const secondDashLevel = fudgingFunction(rowIdx % 2 === 1 ? this.signals.lowLevel : this.signals.highLevel);
                const secondDashColorIdx = !inDropAfterGlow ? rowIdx + i*12997217 + this.colorOffset : 1;
                const secondDashLeftColor = this.randomColor(secondDashColorIdx, inDropAfterGlow);
                const secondDashRightColor = this.randomColor(secondDashColorIdx, inDropAfterGlow);
                this.renderDash(secondDashStart, ledsInSecondDash, secondDashLevel, secondDashLeftColor, secondDashRightColor, row);
            }
        });
    }

    private renderDash(dashStart: number, ledsInDash: number, radius: number, leftColor: Colors.Color, rightColor: Colors.Color, row: ColorRow) {
        const center = dashStart + ledsInDash / 2;
        const dashLo = Math.floor(center - ledsInDash / 2);
        const dashHi = Math.ceil(center + ledsInDash / 2);
        const radiusInLeds = radius * ledsInDash;
        for (let l = dashLo; l <= dashHi; ++l) {
            const aliasing = bracket01(radiusInLeds - Math.abs(l - center));
            row.add(l, Colors.multiply(leftColor, aliasing));
            row.add(row.length - l, Colors.multiply(rightColor, aliasing));
        }
    }

    private randomColor(key: number, inDropAfterGlow: boolean) {
        if (!inDropAfterGlow) {
            return this.regularPalette[key % this.regularPalette.length];
        } else {
            return this.dropPalette[key];
        }
    }

    private swapPalettes() {
        this.regularPalette = randomPalette(8);
        this.dropPalette = [this.regularPalette[2], this.regularPalette[7]];
        this.lastPaletteSwap = Date.now();
    }
}

function fudgingFunction(x: number) {
    return x * 0.75 + 0.05;
}

const factory = new Visualization.Factory(NAME, ExpandingDashesVisualization);
export default factory;
