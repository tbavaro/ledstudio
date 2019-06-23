import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const SAMPLE_SIZE = 1024;

class AudioRmsHelper {
  private scriptNode: ScriptProcessorNode;
  public channelRms: Float32Array;

  constructor(audioSource: AudioNode) {
    const audioContext = audioSource.context;
    this.scriptNode = audioContext.createScriptProcessor(SAMPLE_SIZE, audioSource.channelCount, audioSource.channelCount);
    audioSource.connect(this.scriptNode);
    this.scriptNode.connect(audioContext.destination);

    this.channelRms = new Float32Array(audioSource.channelCount);

    this.scriptNode.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;

      for (let i = 0; i < inputBuffer.numberOfChannels; ++i) {
        const data = inputBuffer.getChannelData(i);
        this.channelRms[i] = 0;
        // tslint:disable-next-line:prefer-for-of
        for (let k = 0; k < data.length; ++k) {
          this.channelRms[i] += data[k] * data[k];
        }
        this.channelRms[i] = Math.sqrt(this.channelRms[i] / SAMPLE_SIZE);
      }
    };
  }

  public getChannelRms() {
    return this.channelRms;
  }

  public meanChannelRms() {
    let retval = 0;
    this.channelRms.forEach(x => retval += x);
    return retval / this.channelRms.length;
  }
}

export default class TestRmsFromRawPcm extends Visualization.default {
  private readonly noPassRms: AudioRmsHelper | null;
  private readonly loPassRms: AudioRmsHelper | null;
  private readonly hiPassRms: AudioRmsHelper | null;

  constructor(config: Visualization.Config) {
    super(config);
    if (config.audioSource == null) {
      return;
    }

    this.noPassRms = new AudioRmsHelper(config.audioSource);

    const loFilter = new BiquadFilterNode(config.audioSource.context, { type: "lowpass" });
    config.audioSource.connect(loFilter);
    this.loPassRms = new AudioRmsHelper(loFilter);

    const hiFilter = new BiquadFilterNode(config.audioSource.context, { type: "highpass" });
    config.audioSource.connect(hiFilter);
    this.hiPassRms = new AudioRmsHelper(hiFilter);
  }

  public render(context: Visualization.FrameContext): void {
    if (this.noPassRms == null || this.loPassRms === null || this.hiPassRms === null) {
      return;
    }

    context.setFrameTimeseriesPoints([
      {
        color: Colors.RED,
        value: 0.5
      },
      {
        color: Colors.BLUE,
        value: this.noPassRms.meanChannelRms()
      },
      {
        color: Colors.GREEN,
        value: this.loPassRms.meanChannelRms()
      },
      {
        color: Colors.WHITE,
        value: this.hiPassRms.meanChannelRms()
      }
    ]);
  }
}
