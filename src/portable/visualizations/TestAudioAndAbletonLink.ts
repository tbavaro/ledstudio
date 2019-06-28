import { bracket01 } from "../../util/Utils";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import AbletonLinkConnect from "./util/AbletonLinkConnect";
import * as AudioWaveformSampler from "./util/AudioWaveformSampler";
import BeatController from "./util/BeatController";


export default class TestAudioAndAbletonLink extends Visualization.default {
  private link: BeatController;
  private readonly analyserHelpers: ReturnType<typeof createAnalyserHelpers> | null;
  private readonly duringBeatTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly loudnessTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly currentRMSAmplitudeTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);
    this.link = new AbletonLinkConnect();

    const audioSource = config.audioSource;
    if (audioSource !== null) {
      this.analyserHelpers = createAnalyserHelpers(AudioWaveformSampler.ScriptProcessorNodeAudioWaveformSampler, audioSource);
    } else {
      this.analyserHelpers = null;
    }

    this.duringBeatTimeSeries = config.createTimeSeries();
    this.loudnessTimeSeries = config.createTimeSeries({ color: Colors.RED });
    this.currentRMSAmplitudeTimeSeries = config.createTimeSeries({ color: Colors.GREEN });
  }


  public render(context: Visualization.FrameContext): void {
    if (this.analyserHelpers === null) {
      return;
    }

    this.analyserHelpers.sampleAll();

    const duringBeat = this.link.timeSinceLastBeat() < 0.1;
    const loudness = bracket01(this.analyserHelpers.direct.currentMaxAmplitude);

    this.ledRows.forEach(row => {
      row.fill(duringBeat ? loudness * Colors.WHITE : Colors.BLACK);
    });

    this.duringBeatTimeSeries.set(duringBeat ? 1 : 0);
    this.loudnessTimeSeries.set(loudness);
    this.currentRMSAmplitudeTimeSeries.set(this.analyserHelpers.direct.currentRMSAmplitude);
  }
}

function createAnalyserHelpers(
  samplerConstructor: AudioWaveformSampler.Implementation,
  audioSource: AudioNode
) {
  const audioContext = audioSource.context;
  const numSamples = 1024;

  const samplers: AudioWaveformSampler.default[] = [];

  const createAnalyserHelper = (createFilter?: () => AudioNode) => {
    let filteredAudioSource: AudioNode;
    if (createFilter) {
      const filter = createFilter();
      audioSource.connect(filter);
      filteredAudioSource = filter;
    } else {
      filteredAudioSource = audioSource;
    }

    const sampler = new samplerConstructor(filteredAudioSource, numSamples);
    samplers.push(sampler);

    return sampler;
  };

  const direct = createAnalyserHelper();
  const low = createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "lowpass" }));
  const high = createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "highpass" }));

  return {
    direct,
    low,
    high,
    sampleAll: () => samplers.forEach(s => s.sample())
  };
}

