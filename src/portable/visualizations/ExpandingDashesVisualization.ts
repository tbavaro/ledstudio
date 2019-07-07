import EMAHelper from "../../util/EMAHelper";
import { bracket, bracket01, valueOrDefault } from "../../util/Utils";
import { CircularQueue } from "../../util/WindowStats";
import BeatController from "../base/BeatController";
import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import FancyValue from "../base/FancyValue";
import * as Visualization from "../base/Visualization";
import BasicAudioHelper from "./util/BasicAudioHelper";
import { randomPalette } from "./util/Utils";

const NAME = "expandingDashes";

class ExpandingDashesVisualization extends Visualization.default {

    private regularPalette: Colors.Color[];
    private dropPalette: Colors.Color[];
    private readonly wingDashPaires: number[];
    private readonly wingDashPairRatioes: number[];
    private readonly ezTimeseries: Visualization.EasyTimeSeriesValueSetters;
    private readonly signals: SignalsHelper;
    private readonly colorOffset: number;
    private lastPaletteSwap = Date.now();

    constructor(config: Visualization.Config) {
        super(config);
        this.regularPalette = randomPalette(8);
        this.dropPalette = randomPalette(4);
        this.colorOffset = Math.floor(Math.random() * this.regularPalette.length);
        this.wingDashPaires = [0, 0, 0, 0].map(_ => Math.round(Math.random() * 3) + 3);
        this.wingDashPairRatioes = [0.66, 0.34, 0.34, 0.66];

        this.ezTimeseries = config.createEasyTimeSeriesSet();
        this.signals = new SignalsHelper(config.audioSource);
    }

    public render(context: Visualization.FrameContext): void {
        const { elapsedMillis, beatController } = context;

        if (Date.now() - this.lastPaletteSwap > 30000 && this.signals.isStrongBeat) {
            this.maybeSwapPalettes();
        }

        this.signals.update(elapsedMillis, beatController);
        this.ledRows.forEach(r => r.fill(Colors.BLACK));

        this.ezTimeseries.orange.value = this.signals.lowHelper.halfLife;
        this.ezTimeseries.white.value = this.signals.beatsWithBeats.sum(x => x) / 8;

        if (this.signals.isDrop) {
            this.signals.lowHelper.halfLife = LevelsHelper.HALF_LIFE_MIN;
            this.signals.highHelper.halfLife = LevelsHelper.HALF_LIFE_MIN;
        }
        if (this.signals.isDance) {
            this.signals.lowHelper.halfLife = LevelsHelper.HALF_LIFE_MIN;
        }

        const inDropAfterGlow = this.signals.beatsSinceDrop < 16;
        if (inDropAfterGlow) {
            this.signals.lowHelper.halfLife = LevelsHelper.HALF_LIFE_MIN;
        }

        this.ledRows.forEach((row, rowIdx) => {
            const wingRowLength = row.length / 2;
            const wingRowDashPaires = this.wingDashPaires[rowIdx];
            const ledsPerDashPair = Math.floor(wingRowLength / wingRowDashPaires);
            const rowOffset = Math.floor((wingRowLength - ledsPerDashPair * wingRowDashPaires) / 2);
            for (let i = 0; i < wingRowDashPaires; ++i) {
                const dashPairStart = Math.round(rowOffset + i * ledsPerDashPair);
                const firstDashStart = dashPairStart;
                const ledsInFirstDash = Math.round(ledsPerDashPair * this.wingDashPairRatioes[rowIdx]);
                const firstDashLevel = stupid(rowIdx % 2 === 0 ? this.signals.lowLevel : this.signals.highLevel);
                const firstDashColorIdx = !inDropAfterGlow ? rowIdx+i + this.colorOffset : 0;
                const firstDashLeftColor = this.randomColor(firstDashColorIdx, inDropAfterGlow, true);
                const firstDashRightColor = this.randomColor(firstDashColorIdx, inDropAfterGlow, false);
                this.renderDash(firstDashStart, ledsInFirstDash, firstDashLevel, firstDashLeftColor, firstDashRightColor, row);

                const secondDashStart = firstDashStart + ledsInFirstDash;
                const ledsInSecondDash = ledsPerDashPair - ledsInFirstDash;
                const secondDashLevel = stupid(rowIdx % 2 === 1 ? this.signals.lowLevel : this.signals.highLevel);
                const secondDashColorIdx = !inDropAfterGlow ? rowIdx + i*12997217 + this.colorOffset : 2;
                const secondDashLeftColor = this.randomColor(secondDashColorIdx, inDropAfterGlow, true);
                const secondDashRightColor = this.randomColor(secondDashColorIdx, inDropAfterGlow, false);
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

    private randomColor(key: number, inDropAfterGlow: boolean, isLeft: boolean) {
        if (!inDropAfterGlow) {
            return this.regularPalette[key % this.regularPalette.length];
        } else {
            return this.dropPalette[(key + (isLeft ? 0 : 1)) % this.dropPalette.length];
        }
    }

    private maybeSwapPalettes() {
        this.regularPalette = randomPalette(8);
        this.dropPalette = randomPalette(4);
        this.lastPaletteSwap = Date.now();
    }
}

function stupid(x: number) {
    return x * 0.75 + 0.05;
}

class LevelsHelper {
    private readonly v: FancyValue = new FancyValue();
    private readonly minThreshold: number;
    private readonly maxThreshold: number;
    public static readonly HALF_LIFE_MIN = 0.125;
    public halfLife: number;
    public readonly vEMA = new EMAHelper(0.0023); // about 20s

    constructor(attrs: {
        minThreshold?: number,
        maxThreshold?: number
    }) {
        this.minThreshold = valueOrDefault(attrs.minThreshold, 0);
        this.maxThreshold = valueOrDefault(attrs.maxThreshold, 1);
        this.halfLife = 0.125;
    }

    public processValue(newValue: number, elapsedMillis: number) {
        const value = bracket01((newValue - this.minThreshold) / (this.maxThreshold - this.minThreshold));
        this.v.decayExponential(this.halfLife, elapsedMillis / 1000);
        this.v.bumpTo(value);

        if (!isNaN(this.value)) {
            this.vEMA.update(this.value);
            const diff = this.vEMA.ema - 0.25;
            this.halfLife -= bracket(-0.125/10, 0.125/10, diff * 0.2);
            this.halfLife = bracket(LevelsHelper.HALF_LIFE_MIN, 1, this.halfLife);
        }
    }

    public get value() {
        return this.v.value;
    }
}

class SignalsHelper {
    private readonly audioHelper: BasicAudioHelper;
    public readonly lowHelper: LevelsHelper;
    public readonly highHelper: LevelsHelper;
    private isDropValue = false;
    private isStrongBeatValue = false;
    private isNewBeatValue = false;
    private lastBeat = -10000000;
    private dropBeat = -10000000;
    private beatSinceDropValue = -10000000;

    private beatOnBeat = false;
    public beatsWithBeats = new CircularQueue<number>(8);

    constructor(audioSource: AudioNode) {
        this.audioHelper = new BasicAudioHelper(audioSource);

        this.lowHelper = new LevelsHelper({
            minThreshold: 0.3,
            maxThreshold: 5
        });

        this.highHelper = new LevelsHelper({
            minThreshold: 0.3,
            maxThreshold: 5
        });
    }

    public update(elapsedMillis: number, beatController: BeatController) {
        const audioValues = this.audioHelper.getValues();

        this.lowHelper.processValue(audioValues.lowRMSZScore20, elapsedMillis);
        this.highHelper.processValue(audioValues.highRMSZScore20, elapsedMillis);

        const beatNow = beatController.beatNumber();
        const nearBeat = beatController.timeSinceLastBeat() < 0.1 || beatController.progressToNextBeat() > 0.95;
        if (audioValues.lowRMSZScore3 > 4 && nearBeat) {
            this.dropBeat = beatNow;
            this.isDropValue = true;
        } else {
            this.isDropValue = false;
        }

        if (audioValues.lowRMSZScore3 > 2 && nearBeat) {
            this.isStrongBeatValue = true;
        } else {
            this.isStrongBeatValue = false;
        }

        this.beatSinceDropValue = beatNow - this.dropBeat;
        this.isNewBeatValue = beatNow !== this.lastBeat;
        if (this.isNewBeat) {
            this.beatsWithBeats.push(this.beatOnBeat ? 1: 0);
            this.beatOnBeat = false;
        }
        if (audioValues.lowRMSZScore3 > 1.2 && nearBeat) {
            this.beatOnBeat = true;
        }
        this.lastBeat = beatNow;
    }

    public get lowLevel() {
        return this.lowHelper.value;
    }

    public get highLevel() {
        return this.highHelper.value;
    }

    public get isDrop() {
        return this.isDropValue;
    }

    public get isStrongBeat() {
        return this.isStrongBeatValue;
    }

    public get beatsSinceDrop() {
        return this.beatSinceDropValue;
    }

    public get isNewBeat() {
        return this.isNewBeatValue;
    }

    public get isDance() {
        return this.beatsWithBeats.sum(x => x) > 6;
    }
}

const factory = new Visualization.Factory(NAME, ExpandingDashesVisualization);
export default factory;
