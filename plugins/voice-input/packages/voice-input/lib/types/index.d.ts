/**
 * Local offline voice-to-text: the Host Remote the browser half calls to
 * transcribe recorded audio (sherpa-onnx SenseVoice) and, on the final
 * segment, punctuate it (CT-Transformer). Models load ONCE at service init
 * via the sherpa-onnx-node native addon — no process spawn, no temp files.
 * @module @deepseek-ai/dsh-voice-input
 */
import { Context, Service } from '@deepseek-ai/cordis';
import s from '@deepseek-ai/schemastery';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { VoiceInputConfig, VoiceTranscribeRequest, VoiceTranscribeResult } from './types.ts';
export type * from './types.ts';
/** Remote-only service exposing the local voice transcription capability. */
export declare class VoiceInputGateway extends TypertRemoteService {
    static inject: readonly [];
    /** Schemastery config schema: the Loader validates and fills defaults before construction. */
    static Config: s<VoiceInputConfig>;
    private readonly cfg;
    private recognizer?;
    private punctuator?;
    constructor(ctx: Context, config: VoiceInputConfig);
    /** Load models once at service init (async, non-blocking). */
    protected [Service.init](): Promise<void>;
    /**
     * Transcribe a Float32Array of 16 kHz mono PCM samples (sent as base64).
     * Uses the in-memory recognizer — no process spawn, no temp files.
     * On the final segment, adds punctuation if a punctuator is configured.
     */
    transcribe(request: VoiceTranscribeRequest): Promise<VoiceTranscribeResult>;
}
export default VoiceInputGateway;
//# sourceMappingURL=index.d.ts.map