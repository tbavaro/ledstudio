export default class EMAHelper {

    private readonly alpha: number;
    private emaValue: number | null;
    private emvValue: number | null;
    private zScoreValue: number | null;

    constructor(alpha: number) {
        this.alpha = alpha;
    }

    public update(newValue: number) {
        if (this.emaValue == null || this.emvValue == null || this.zScoreValue == null) {
            this.emaValue = newValue;
            this.emvValue = 0;
            this.zScoreValue = 0;
            return;
        }

        const diff = newValue - this.emaValue;
        const incr = this.alpha * diff;
        this.emaValue = incr +  this.emaValue;
        this.emvValue =  (1 - this.alpha) * (this.emvValue + diff * incr);

        const stddev = Math.sqrt(this.emv);
        this.zScoreValue = (newValue - this.ema) / stddev;
    }

    public get ema() {
        return this.emaValue != null ? this.emaValue : 1;
    }

    public get emv() {
        return this.emvValue != null ? this.emvValue : 0;
    }

    public get zScore() {
        return this.zScoreValue != null ? this.zScoreValue : 0;
    }
}
