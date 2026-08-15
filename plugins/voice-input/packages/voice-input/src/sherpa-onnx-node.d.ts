/** Minimal ambient declaration for the sherpa-onnx-node native addon. */
declare module 'sherpa-onnx-node' {
  export interface Waveform {
    samples: Float32Array
    sampleRate: number
  }
  export interface OfflineRecognizerResult {
    text: string
    lang?: string
    emotion?: string
    event?: string
  }
  export interface OfflineStream {
    acceptWaveform(obj: Waveform): void
    setOption(key: string, value: string): void
  }
  export interface OfflineRecognizerConfig {
    modelConfig: {
      senseVoice?: { model: string; language?: string; useInverseTextNormalization?: number }
      tokens: string
      numThreads?: number
      debug?: boolean | number
      provider?: string
    }
  }
  export class OfflineRecognizer {
    constructor(config: OfflineRecognizerConfig)
    static createAsync(config: OfflineRecognizerConfig): Promise<OfflineRecognizer>
    createStream(hotwords?: string): OfflineStream
    decode(stream: OfflineStream): void
    decodeAsync(stream: OfflineStream): Promise<OfflineRecognizerResult>
    getResult(stream: OfflineStream): OfflineRecognizerResult
    setConfig(config: OfflineRecognizerConfig): void
  }
  export interface OfflinePunctuationConfig {
    model: { ctTransformer: string; numThreads?: number; debug?: boolean | number; provider?: string }
  }
  export class OfflinePunctuation {
    constructor(config: OfflinePunctuationConfig)
    addPunct(text: string): string
  }
  export function readWave(path: string): Waveform & { samples: Float32Array; sampleRate: number }
  export function writeWave(path: string, samples: Float32Array, sampleRate: number): void
  const _default: { OfflineRecognizer: typeof OfflineRecognizer; OfflinePunctuation: typeof OfflinePunctuation; readWave: typeof readWave }
  export default _default
}
