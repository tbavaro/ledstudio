import { bracket01 } from "../../../util/Utils";
import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";
import * as AudioWaveformSampler from "../../visualizationUtils/AudioWaveformSampler";

export default class TestAudioAndAbletonLink extends Visualization.default {
  private readonly analyserHelpers: ReturnType<
    typeof AudioWaveformSampler.createAnalyserHelpers
  > | null;
  private readonly duringBeatTimeSeries: Visualization.TimeSeriesValue;
  private readonly loudnessTimeSeries: Visualization.TimeSeriesValue;
  private readonly currentRMSAmplitudeTimeSeries: Visualization.TimeSeriesValue;

  constructor(config: Visualization.Config) {
    super(config);

    const audioSource = config.audioSource;
    if (audioSource !== undefined) {
      this.analyserHelpers =
        AudioWaveformSampler.createAnalyserHelpers(audioSource);
    } else {
      this.analyserHelpers = null;
    }

    this.duringBeatTimeSeries = config.createTimeSeries();
    this.loudnessTimeSeries = config.createTimeSeries({ color: Colors.RED });
    this.currentRMSAmplitudeTimeSeries = config.createTimeSeries({
      color: Colors.GREEN
    });
  }

  public render(context: Visualization.FrameContext): void {
    if (this.analyserHelpers === null) {
      return;
    }

    this.analyserHelpers.sampleAll();

    const duringBeat = context.beatController.timeSinceLastBeat() < 0.1;
    const loudness = bracket01(this.analyserHelpers.direct.currentMaxAmplitude);

    this.ledColors.fill(duringBeat ? loudness * Colors.WHITE : Colors.BLACK);

    this.duringBeatTimeSeries.value = duringBeat ? 1 : 0;
    this.loudnessTimeSeries.value = loudness;
    this.currentRMSAmplitudeTimeSeries.value =
      this.analyserHelpers.direct.currentRMSAmplitude;
  }
}
