/** Automatic image-to-text fallback for text-only conversation models. */
import { Context, Service } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { ImageInputFallback, ModelSelection } from '@deepseek-ai/dsh-agent';
import { type UserMessage } from '@deepseek-ai/dsh-llm';
declare module '@deepseek-ai/dsh-llm' {
    interface MessageSourceMap {
        /** UI-only copy of a human image prompt; excluded from the model surface. */
        'vision-fallback-display': {
            kind: 'user';
            visionFallback: 'display';
        };
        /** Text-only model input paired with one UI-only image-prompt copy. */
        'vision-fallback-input': {
            kind: 'user';
            visionFallback: 'model-input';
            displaySeq?: number;
        };
    }
}
declare module '@deepseek-ai/dsh-session/types' {
    interface SessionEventMap {
        /** Human-authored image prompt retained for UI replay but excluded from model history. */
        'vision-fallback/display': UserMessage;
    }
}
/** Cordis plugin and durable message-source identity. */
export declare const name = "vision-fallback";
/** Browser-editable settings for the dormant-by-default fallback service. */
export declare const VISION_FALLBACK_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Vision route and bounded auxiliary-call policy. */
export interface Config {
    /** Whether text-only routes may use the auxiliary vision route. */
    enabled?: boolean;
    /** Registered provider route for the auxiliary vision request. */
    provider?: string;
    /** Provider-owned model id that accepts image input. */
    model?: string;
    /** Maximum output tokens for one visual observation. */
    maxTokens?: number;
    /** Wall-clock limit for one auxiliary request, in milliseconds. */
    timeoutMs?: number;
}
/** Schemastery validation for {@link Config}. */
export declare const Config: z<Config>;
/** Service that admits image prompts and rewrites them before a text-only model request. */
export declare class VisionFallback extends Service implements ImageInputFallback {
    static inject: string[];
    static Config: z<Config>;
    private source;
    constructor(ctx: Context, config: Config);
    canHandle(selection: ModelSelection): Promise<boolean>;
}
export default VisionFallback;
//# sourceMappingURL=index.d.ts.map