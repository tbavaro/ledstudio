import * as Colors from "../base/Colors";
import LedInfo from "../base/LedInfo";
import * as Visualization from "../base/Visualization";
import * as AudioWaveformSampler from "./util/AudioWaveformSampler";

const NAME = "spreadShootersAudioVisualization";

interface Info {
    time: number;
    rib: number;
    brightness: number;
    hue: number;
}

interface LedRowInfo {
    rowIdx: number;
    idx: number;
}

// interface SparkleInfo {
//     value: number;
//     row: number;
//     idx: number;
// }

function randomHue() {
    return Math.floor(Math.random() * 360);
}

const BASE_SHOOTER_PER_S = 0.5;
const SHOOTER_DURATION_MS = 1000;

class SpreadShootersAudioVisualization extends Visualization.default {
    private info = new Array<Info>();
    // private sparkles = new Array<SparkleInfo>();
    private time = 0;
    private ezTS: Visualization.EasyTimeSeriesValueSetters;
    private analyserHelpers: ReturnType<typeof AudioWaveformSampler.createAnalyserHelpers> | null;
    private readonly reverseLedInfo: LedRowInfo[][];
    private dropVizLastBeat = 0;
    private dropBeat = 0;

    constructor(config: Visualization.Config) {
        super(config);
        this.ezTS = config.createEasyTimeSeriesSet();
        const audioSource = config.audioSource;
        if (audioSource !== null) {
          this.analyserHelpers = AudioWaveformSampler.createAnalyserHelpers(audioSource);
        } else {
          this.analyserHelpers = null;
        }

        this.reverseLedInfo = reverseLedInfo(config.scene.leds);
        this.reverseLedInfo.forEach( x=> x);
    }

    public render(context: Visualization.FrameContext): void {
        const { elapsedMillis, beatController } = context;
        if (this.analyserHelpers == null) {
            return;
        }
        this.analyserHelpers.low.sample();
        this.analyserHelpers.direct.sample();
        this.time += elapsedMillis;

        this.info = this.info.filter(kt => this.time - kt.time < SHOOTER_DURATION_MS*1.5);

        const beatNow = beatController.beatNumber();
        const nearBeat = beatController.timeSinceLastBeat() < 0.1 || beatController.progressToNextBeat() > 0.95;
        if (this.analyserHelpers.low.currentRMSZScore > 4 && nearBeat) {
            this.dropBeat = beatNow;
            this.dropVizLastBeat = 0;
        }
        if (this.analyserHelpers.low.currentRMSZScore > 4) {
            console.log(beatController.progressToNextBeat());
        }

        this.ezTS.white.value = this.analyserHelpers.low.currentRMSExpMovingAvg * 4;
        this.ezTS.blue.value = this.analyserHelpers.low.currentRMSExpMovingVar * 50;
        this.ezTS.orange.value = this.analyserHelpers.low.currentRMSZScore / 6;
        this.ezTS.red.value = beatController.progressToNextBeat();

        if (beatNow - this.dropBeat < 16) {
            if (this.dropVizLastBeat !== beatNow) {
                const hue = randomHue();
                for (let i = 0; i < this.reverseLedInfo.length; ++i) {
                    this.info.push({time: this.time, rib: i, brightness: 1, hue: hue});
                }
                this.dropVizLastBeat = beatNow;
            }
        } else {
            const volumeAdjustment = (this.analyserHelpers.direct.currentRMSAmplitude - 0.1) / 0.1;
            const brightness = 1;
            const shooter = 0.0025 * Math.random() < volumeAdjustment * elapsedMillis / 1000 * BASE_SHOOTER_PER_S;
            if (shooter) {
                const rib = Math.floor(Math.random() * this.reverseLedInfo.length);
                this.info.push({time: this.time, rib, brightness, hue: randomHue()});
            }
        }

        // reset leds
        this.ledRows.forEach(row => row.fill(Colors.BLACK));

        for (const kt of this.info) {
            const elapsed = this.time - kt.time;

            const rib = this.reverseLedInfo[kt.rib];
            const ribIdx = Math.round((elapsed / SHOOTER_DURATION_MS) * (rib.length));

            let brightness = kt.brightness;
            for (let i = ribIdx; i >= 0 && brightness > 0; --i) {
                const c = Colors.hsv(kt.hue, 1, brightness);
                brightness -= 3 / rib.length;
                if (i < rib.length) {
                    const { rowIdx, idx } = rib[i];
                    this.ledRows.get(rowIdx).add(idx, c);
                }
            }
        }

        // // add dem sparkles dat we luv
        // this.sparkles = this.sparkles.filter(si => si.value > 0);
        // for (let i = 0; i < this.leds.length; ++i) {
        //     const rgb = Colors.split(this.leds.get(i));
        //     const v = Math.max(rgb[0], rgb[1], rgb[2]);
        //     if (v > 0 && Math.random() < 0.02 && this.sparkles.findIndex(si => si.led === i) < 0) {
        //         this.sparkles.push({value: v, led: i});
        //     }
        // }
        // for (const si of this.sparkles) {
        //     const sparkleColor = Colors.hsv(randomHue(), Math.random()*0.25, si.value);
        //     this.leds.add(si.led, sparkleColor);
        //     si.value -= 0.03;
        // }
    }
}

function reverseLedInfo(ledInfos: LedInfo[][]) {
    let nChannels = 0;
    ledInfos.forEach(infoRow => {
        infoRow.forEach(info => {
            nChannels = Math.max(nChannels, info.hardwareChannel);
        });
    });
    const retval: LedRowInfo[][] = [];
    for (let i = 0; i < nChannels; ++i) {
        retval.push([]);
    }
    ledInfos.forEach((infoRow, rowIdx) => {
        infoRow.forEach((info, idx) => {
            retval[info.hardwareChannel-1][info.hardwareIndex] = {rowIdx, idx};
        });
    });
    return retval;
}

const factory = new Visualization.Factory(NAME, SpreadShootersAudioVisualization);
export default factory;
