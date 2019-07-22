import { bracket01 } from "../../../util/Utils";
import * as Colors from "../../base/Colors";
import LedMetadata from "../../base/LedMetadata";
import * as Visualization from "../../base/Visualization";
import { Signals } from "../../visualizationUtils/SignalsHelper";
import { randomPalette } from "../../visualizationUtils/Utils";

interface Info {
    time: number;
    rib: number;
    brightness: number;
    color: number;
    speed: number;
}

interface LedRowInfo {
    rowIdx: number;
    idx: number;
}

interface SparkleInfo {
    value: number;
    row: number;
    idx: number;
}

const BASE_SHOOTER_PER_S = 4.0;

export default class SpreadShootersAudioVisualization extends Visualization.RowColumnMappedVisualization {
    private info = new Array<Info>();
    private sparkles = new Array<SparkleInfo>();
    private ezTS: Visualization.EasyTimeSeriesValueSetters;
    private readonly reverseLedInfo: LedRowInfo[][];
    private signals: Signals;
    private palette: number[];
    private lastPaletteSwap: number;


    constructor(config: Visualization.Config) {
        super(config);
        this.ezTS = config.createEasyTimeSeriesSet();
        this.reverseLedInfo = reverseLedInfo(this.ledRowMetadatas);
        this.reverseLedInfo.forEach( x=> x);
        this.signals = config.signals;
        this.swapPalettes();
    }

    public render(context: Visualization.FrameContext): void {
        const { elapsedMillis } = context;

        const now = Date.now();
        if (now - this.lastPaletteSwap > 30000 && this.signals.soundsLikeStrongBeat) {
            this.swapPalettes();
        }


        this.info = this.info.filter(kt => now - kt.time < kt.speed*1.5);

        this.ezTS.red.value = this.signals.audioValues.lowRMSZScore20 / 4;
        this.ezTS.green.value = this.signals.lowLevel;
        this.ezTS.orange.value = this.signals.audioValues.lowRMSEMA20 * 4;

        if (this.signals.beatsSinceDrop < 16) {
            if (this.signals.soundsLikeNewBeat) {
                const color = this.randomColor();
                for (let i = 0; i < this.reverseLedInfo.length; ++i) {
                    const speed = i % 2 === 1 ? 2000 : 1000;
                    this.info.push({time: now, rib: i, brightness: 1, color, speed});
                }
            }
        } else {
            const brightness = bracket01(this.signals.audioValues.unfilteredRMS / 0.4);
            const volumeAdjustment = bracket01(this.signals.audioValues.unfilteredRMS / 0.2);
            const shooters = volumeAdjustment * (elapsedMillis / 1000 * BASE_SHOOTER_PER_S);
            for (let i = 0 ; i < shooters; ++i) {
                const rib = Math.floor(Math.random() * this.reverseLedInfo.length);
                const speed = rib % 2 === 1 ? 2000 : 1000;
                this.info.push({time: now, rib, brightness, color: this.randomColor(), speed});
            }
        }

        // reset leds
        this.ledRows.forEach(row => row.fill(Colors.BLACK));

        for (const kt of this.info) {
            const elapsed = now - kt.time;

            const rib = this.reverseLedInfo[kt.rib];
            const ribIdx = Math.round((elapsed / kt.speed) * (rib.length));

            let brightness = kt.brightness;
            for (let i = ribIdx; i >= 0 && brightness > 0; --i) {
                const c = Colors.multiply(kt.color, brightness);
                brightness -= 3 / 25;
                if (i < rib.length) {
                    const { rowIdx, idx } = rib[i];
                    this.ledRows.get(rowIdx).add(idx, c);
                }
            }
        }

        // add dem sparkles dat we luv
        this.sparkles = this.sparkles.filter(si => si.value > 0);
        this.ledRows.forEach((row, rowIdx) =>{
            row.forEach((color, ledIdx) => {
                const rgb = Colors.split(color);
                const v = Math.max(rgb[0], rgb[1], rgb[2]);
                if (v > 0 && Math.random() < 0.002) {
                    this.sparkles.push({value: 0.8, row: rowIdx, idx: ledIdx});
                }
            });
        });
        for (const si of this.sparkles) {
            const sparkleColor = Colors.hsv(1, Math.random()*0.25, si.value);
            this.ledRows.get(si.row).add(si.idx, sparkleColor);
            si.value += Math.sin(now / 20) * 0.15 - 0.02;
        }
    }

    private swapPalettes() {
        this.palette = randomPalette(8);
        this.lastPaletteSwap = Date.now();
    }

    private randomColor() {
        return this.palette[Math.floor(Math.random() * this.palette.length)];
    }
}

function reverseLedInfo(ledMetadatas: LedMetadata[][]) {
    let nChannels = 0;
    ledMetadatas.forEach(infoRow => {
        infoRow.forEach(info => {
            nChannels = Math.max(nChannels, info.hardwareChannel);
        });
    });
    const retval: LedRowInfo[][] = [];
    for (let i = 0; i < nChannels; ++i) {
        retval.push([]);
    }
    ledMetadatas.forEach((rowLedMetadatas, rowIdx) => {
        rowLedMetadatas.forEach((ledMetadata, idx) => {
            retval[ledMetadata.hardwareChannel-1][ledMetadata.hardwareIndex] = {rowIdx, idx};
        });
    });
    return retval;
}

export class DerezSpreadShootersAudioVisualization extends Visualization.DerezVisualization {
  constructor(config: Visualization.Config) {
    super(new SpreadShootersAudioVisualization(config), 0.82);
  }
}
