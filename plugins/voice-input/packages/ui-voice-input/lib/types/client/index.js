/**
 * Voice input plugin, browser half: a mic button in the conversation input's
 * right tool row. Records through getUserMedia, streams re-transcriptions
 * while speaking, and punctuates on stop through the
 * `@deepseek-ai/dsh-voice-input` Remote.
 */
import { VoiceInputButton } from "./VoiceInputButton.js";
/** Required services: slot registration and the mounted voiceInput Remote. */
export const inject = ['slots', 'remote'];
/**
 * Client plugin body: register the mic button into the composer's right tool
 * row once the slot declarer and the voiceInput Remote are both ready.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.inject(['slots', 'remote'], (scope) => {
        const remote = scope.remote;
        scope.slots.inject('conversation.input.right', () => scope.slots.register({
            name: 'conversation.input.right',
            id: 'voice-input',
            order: 100,
            label: '语音输入',
            inject: () => ({ remote: remote.voiceInput }),
        }, VoiceInputButton));
    });
}
//# sourceMappingURL=index.js.map