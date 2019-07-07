import BeatController from "../../../portable/base/BeatController";
import FancyValue from "../../../portable/base/FancyValue";
import EMAHelper from "../../../util/EMAHelper";
import { bracket, bracket01, valueOrDefault } from "../../../util/Utils";
import { CircularQueue } from "../../../util/WindowStats";
import BasicAudioHelper from "./BasicAudioHelper";
import { AudioValues } from "./BasicAudioHelper";


export class LevelsHelper {
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

export class SignalsHelper {
    private readonly audioHelper: BasicAudioHelper;
    public readonly lowDecaySignal: LevelsHelper;
    public readonly highDecaySignal: LevelsHelper;
    private isDropValue = false;
    private isStrongBeatValue = false;
    private isNewBeatValue = false;
    private lastBeat = -10000000;
    private dropBeat = -10000000;
    private beatSinceDropValue = -10000000;

    private beatOnBeat = false;
    public beatsWithBeats = new CircularQueue<number>(8);
    public audioValues: AudioValues;

    constructor(audioSource: AudioNode | null) {
        this.audioHelper = new BasicAudioHelper(audioSource);

        this.lowDecaySignal = new LevelsHelper({
            minThreshold: 0.3,
            maxThreshold: 5
        });

        this.highDecaySignal = new LevelsHelper({
            minThreshold: 0.3,
            maxThreshold: 5
        });
    }

    public update(elapsedMillis: number, beatController: BeatController) {
        this.audioValues = this.audioHelper.getValues();

        this.lowDecaySignal.processValue(this.audioValues.lowRMSZScore20, elapsedMillis);
        this.highDecaySignal.processValue(this.audioValues.highRMSZScore20, elapsedMillis);

        const beatNow = beatController.beatNumber();
        const nearBeat = beatController.timeSinceLastBeat() < 0.1 || beatController.progressToNextBeat() > 0.95;
        if (this.audioValues.lowRMSZScore3 > 4 && nearBeat) {
            this.dropBeat = beatNow;
            this.isDropValue = true;
        } else {
            this.isDropValue = false;
        }

        if (this.audioValues.lowRMSZScore3 > 2 && nearBeat) {
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
        if (this.audioValues.lowRMSZScore3 > 1.2 && nearBeat) {
            this.beatOnBeat = true;
        }
        this.lastBeat = beatNow;
    }

    public get lowLevel() {
        return this.lowDecaySignal.value;
    }

    public get highLevel() {
        return this.highDecaySignal.value;
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
