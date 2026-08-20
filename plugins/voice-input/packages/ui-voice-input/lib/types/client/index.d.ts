/**
 * Voice input plugin, browser half: a mic button in the conversation input's
 * right tool row. Records through getUserMedia, streams re-transcriptions
 * while speaking, and punctuates on stop through the
 * `@deepseek-ai/dsh-voice-input` Remote.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: the slot registry and the mounted voiceInput Remote namespace. */
export declare const inject: string[];
/**
 * Client plugin body: register the mic button into the composer's right tool
 * row once the slot declarer and the voiceInput Remote are both ready.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map