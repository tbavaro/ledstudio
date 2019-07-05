import { bracket01 } from "../../util/Utils";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const NAME = "expandingDashes";

class ExpandingDashesVisualization extends Visualization.default {

    private readonly palette: Colors.Color[];
    private readonly wingDashes: number[];
    private readonly ezTimeseries: Visualization.EasyTimeSeriesValueSetters;

    constructor(config: Visualization.Config) {
        super(config);
        const hexPalette = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"];
        this.palette = hexPalette.map(Colors.hex2Color, hexPalette);
        shuffleArray(this.palette);

        this.wingDashes = [0, 0, 0, 0].map(_ => Math.round(Math.random() * 5) + 5);

        this.ezTimeseries = config.createEasyTimeSeriesSet();
    }

    public render(context: Visualization.FrameContext): void {
        this.ledRows.forEach(r => r.fill(Colors.BLACK));

        this.ledRows.forEach((row, rowIdx) => {
            const wingRowLength = row.length / 2;
            const wingRowDashes = this.wingDashes[rowIdx];
            const ledsPerDash = Math.floor(wingRowLength / wingRowDashes);
            const rowOffset = Math.floor((wingRowLength - ledsPerDash * wingRowDashes) / 2);
            const radius = Math.sin(Date.now() / 500) * 0.5 + 0.5;
            this.ezTimeseries.orange.value = radius;
            for (let i = 1; i <= wingRowDashes; ++i) {
                const center = Math.round(rowOffset + i * ledsPerDash - ledsPerDash/2);
                const radiusInLeds = radius * ledsPerDash/2;
                const halfLedsToLight = Math.ceil(radiusInLeds);
                for (let l = center - halfLedsToLight; l <= center + halfLedsToLight; ++l) {
                    const aliasing = bracket01(radiusInLeds - Math.abs(l - center));
                    row.add(l, Colors.multiply(this.palette[rowIdx], aliasing));
                    row.add(row.length - l, Colors.multiply(this.palette[rowIdx], aliasing));
                }
            }
        });
    }
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


const factory = new Visualization.Factory(NAME, ExpandingDashesVisualization);
export default factory;
