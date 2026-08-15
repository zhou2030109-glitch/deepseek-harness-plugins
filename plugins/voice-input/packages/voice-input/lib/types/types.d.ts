/** Host configuration for the voice-input plugin: paths to the local STT/punctuation models. */
export interface VoiceInputConfig {
    /** Path to the SenseVoice model (model.int8.onnx). */
    sttModel: string;
    /** Path to the SenseVoice tokens file (tokens.txt). */
    sttTokens: string;
    /** Path to the CT-Transformer punctuation model (model.onnx). Empty disables punctuation. */
    punctModel?: string;
    /** Number of inference threads. Defaults to 1. */
    numThreads?: number;
}
/** One transcription request from the browser half. */
export interface VoiceTranscribeRequest {
    /** Base64-encoded raw Float32 PCM samples (16 kHz mono, values in [-1, 1]). */
    b64: string;
    /** True for the final segment: applies punctuation to the result. */
    final: boolean;
}
/** One transcription result returned to the browser half. */
export interface VoiceTranscribeResult {
    /** Recognized (and, for final segments, punctuated) text. */
    text: string;
    /** Optional human-readable failure detail when `text` is empty. */
    error?: string;
}
//# sourceMappingURL=types.d.ts.map