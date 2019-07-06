import EMAHelper from "../../util/EMAHelper";
import { bracket, bracket01, valueOrDefault } from "../../util/Utils";
import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import FancyValue from "../base/FancyValue";
import * as Visualization from "../base/Visualization";
import BasicAudioHelper from "./util/BasicAudioHelper";

const NAME = "expandingDashes";

class ExpandingDashesVisualization extends Visualization.default {

    private readonly palette: Colors.Color[];
    private readonly wingDashPaires: number[];
    private readonly wingDashPairRatioes: number[];
    private readonly ezTimeseries: Visualization.EasyTimeSeriesValueSetters;
    private readonly helper: MultiLevelHelper;

    constructor(config: Visualization.Config) {
        super(config);
        const hexPalette = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"];
        this.palette = hexPalette.map(Colors.hex2Color, hexPalette);
        shuffleArray(this.palette);

        this.wingDashPaires = [0, 0, 0, 0].map(_ => Math.round(Math.random() * 3) + 3);
        this.wingDashPairRatioes = [0, 0, 0, 0].map(_ => Math.random() > 0.5 ? 0.66 : 0.34);

        this.ezTimeseries = config.createEasyTimeSeriesSet();

        this.helper = new MultiLevelHelper(config.audioSource);
    }

    public render(context: Visualization.FrameContext): void {
        this.helper.sample(context.elapsedMillis);

        this.ledRows.forEach(r => r.fill(Colors.BLACK));

        this.ezTimeseries.orange.value = this.helper.lowHelper.halfLife;
        this.ezTimeseries.white.value = this.helper.lowHelper.vEMA.emv * 10;

        this.ledRows.forEach((row, rowIdx) => {
            const wingRowLength = row.length / 2;
            const wingRowDashPaires = this.wingDashPaires[rowIdx];
            const ledsPerDashPair = Math.floor(wingRowLength / wingRowDashPaires);
            const rowOffset = Math.floor((wingRowLength - ledsPerDashPair * wingRowDashPaires) / 2);
            for (let i = 0; i < wingRowDashPaires; ++i) {
                const dashPairStart = Math.round(rowOffset + i * ledsPerDashPair);
                const firstDashStart = dashPairStart;
                const ledsInFirstDash = Math.round(ledsPerDashPair * this.wingDashPairRatioes[rowIdx]);
                const firstDashLevel = stupid(rowIdx % 2 === 0 ? this.helper.lowLevel : this.helper.highLevel);
                this.renderDash(firstDashStart, ledsInFirstDash, firstDashLevel, rowIdx+i, row);

                const secondDashStart = firstDashStart + ledsInFirstDash;
                const ledsInSecondDash = ledsPerDashPair - ledsInFirstDash;
                const secondDashLevel = stupid(rowIdx % 2 === 1 ? this.helper.lowLevel : this.helper.highLevel);
                this.renderDash(secondDashStart, ledsInSecondDash, secondDashLevel, rowIdx+i*7, row);
            }
        });
    }

    private renderDash(dashStart: number, ledsInDash: number, radius: number, dashKey: number, row: ColorRow) {
        const center = dashStart + ledsInDash / 2;
        const dashLo = Math.floor(center - ledsInDash / 2);
        const dashHi = Math.ceil(center + ledsInDash / 2);
        const radiusInLeds = radius * ledsInDash;
        for (let l = dashLo; l <= dashHi; ++l) {
            const aliasing = bracket01(radiusInLeds - Math.abs(l - center));
            row.add(l, Colors.multiply(this.randomColor(dashKey), aliasing));
            row.add(row.length - l, Colors.multiply(this.randomColor(dashKey *7), aliasing));
        }
    }

    private randomColor(key: number) {
        return this.palette[key % this.palette.length];
    }
}

function stupid(x: number) {
    return x * 0.75 + 0.05;
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

class LevelsHelper {
    private readonly v: FancyValue = new FancyValue();
    private readonly minThreshold: number;
    private readonly maxThreshold: number;
    public halfLife: number;
    public readonly vEMA = new EMAHelper(0.015); // about 3s
    // public readonly vEMA = new EMAHelper(0.0023); // about 20s

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
            // const hlalpha = (this.halfLife - 0.125) / (1 - 0.125);
            // const diff = this.vEMA.ema - (hlalpha*0.3 + (1-hlalpha)*0.1);
            const diff = this.vEMA.ema - 0.25;
            this.halfLife -= bracket(-0.125/10, 0.125/10, diff * 0.1);
            this.halfLife = bracket(0.125, 1, this.halfLife);
        }
    }

    public get value() {
        return this.v.value;
    }
}

class MultiLevelHelper {
    private readonly audioHelper: BasicAudioHelper;
    public readonly lowHelper: LevelsHelper;
    public readonly highHelper: LevelsHelper;

    constructor(audioSource: AudioNode | null) {
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

    public sample(elapsedMillis: number) {
        const audioValues = this.audioHelper.getValues();
        this.lowHelper.processValue(audioValues.lowRMSZScore20, elapsedMillis);
        this.highHelper.processValue(audioValues.highRMSZScore20, elapsedMillis);
    }

    public get lowLevel() {
        return this.lowHelper.value;
    }

    public get highLevel() {
        return this.highHelper.value;
    }
}


const factory = new Visualization.Factory(NAME, ExpandingDashesVisualization);
export default factory;
