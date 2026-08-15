/**
 * Local offline voice-to-text: the Host Remote the browser half calls to
 * transcribe recorded audio (sherpa-onnx SenseVoice) and, on the final
 * segment, punctuate it (CT-Transformer). Models load ONCE at service init
 * via the sherpa-onnx-node native addon — no process spawn, no temp files.
 * @module @deepseek-ai/dsh-voice-input
 */

import { Context, Service } from '@deepseek-ai/cordis'
import s from '@deepseek-ai/schemastery'
import { createRequire } from 'node:module'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
// Typert-generated ./typert and ./remote artifacts import Zod at runtime.
import type {} from 'zod'
import type { VoiceInputConfig, VoiceTranscribeRequest, VoiceTranscribeResult } from './types.ts'

export type * from './types.ts'

const require = createRequire(import.meta.url)

/** Lazily load the native addon (deferred so the schema/build doesn't need it). */
function loadAddon(): typeof import('sherpa-onnx-node') {
  return require('sherpa-onnx-node') as typeof import('sherpa-onnx-node')
}

type Recognizer = import('sherpa-onnx-node').OfflineRecognizer
type Punctuator = import('sherpa-onnx-node').OfflinePunctuation

/** Validate the deployment-varying path set at the configuration boundary. */
function normalizeConfig(config: VoiceInputConfig) {
  const sttModel = requirePath(config.sttModel, 'sttModel')
  const sttTokens = requirePath(config.sttTokens, 'sttTokens')
  return {
    sttModel,
    sttTokens,
    punctModel: config.punctModel ?? '',
    numThreads: config.numThreads ?? 1,
  }
}

function requirePath(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`voice-input: config.${field} is required`)
  }
  return value
}

/** Remote-only service exposing the local voice transcription capability. */
export class VoiceInputGateway extends TypertRemoteService {
  static inject = [] as const

  /** Schemastery config schema: the Loader validates and fills defaults before construction. */
  static Config: s<VoiceInputConfig> = s.object({
    sttModel: s.string().required(),
    sttTokens: s.string().required(),
    punctModel: s.string().default(''),
    numThreads: s.number().step(1).min(1).default(1),
  })

  private readonly cfg: ReturnType<typeof normalizeConfig>
  private recognizer?: Recognizer
  private punctuator?: Punctuator

  constructor(ctx: Context, config: VoiceInputConfig) {
    super(ctx, 'voiceInput')
    this.cfg = normalizeConfig(config)
  }

  /** Load models once at service init (async, non-blocking). */
  protected async [Service.init](): Promise<void> {
    const addon = loadAddon()
    const { OfflineRecognizer, OfflinePunctuation } = addon

    this.recognizer = await OfflineRecognizer.createAsync({
      modelConfig: {
        senseVoice: {
          model: this.cfg.sttModel,
          useInverseTextNormalization: 1,
        },
        tokens: this.cfg.sttTokens,
        numThreads: this.cfg.numThreads,
      },
    })

    if (this.cfg.punctModel) {
      this.punctuator = new OfflinePunctuation({
        model: {
          ctTransformer: this.cfg.punctModel,
          numThreads: this.cfg.numThreads,
        },
      })
    }
  }

  /**
   * Transcribe a Float32Array of 16 kHz mono PCM samples (sent as base64).
   * Uses the in-memory recognizer — no process spawn, no temp files.
   * On the final segment, adds punctuation if a punctuator is configured.
   */
  @Remote('transcribe')
  async transcribe(request: VoiceTranscribeRequest): Promise<VoiceTranscribeResult> {
    if (!this.recognizer) return { text: '', error: '语音模型未加载' }

    const b64 = typeof request?.b64 === 'string' ? request.b64 : ''
    const isFinal = Boolean(request?.final)
    if (!b64) return { text: '', error: '没有收到音频数据' }

    // Decode base64 → Float32Array (raw PCM samples, not WAV)
    const bytes = Buffer.from(b64, 'base64')
    if (bytes.length < 4) return { text: '', error: '音频数据太短' }
    const samples = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)

    // Create a one-shot offline stream, accept the waveform, decode
    const stream = this.recognizer.createStream()
    stream.acceptWaveform({ samples, sampleRate: 16000 })
    const result = await this.recognizer.decodeAsync(stream)

    let text = (result?.text ?? '').trim()
    if (!text) return { text: '', error: isFinal ? '没有识别到文字' : '' }

    // Punctuate only on the final segment
    if (isFinal && this.punctuator) {
      try {
        const punctuated = this.punctuator.addPunct(text).trim()
        if (punctuated) text = punctuated
      } catch {
        // Punctuation failure keeps the raw recognized text
      }
    }

    return { text }
  }
}

export default VoiceInputGateway
