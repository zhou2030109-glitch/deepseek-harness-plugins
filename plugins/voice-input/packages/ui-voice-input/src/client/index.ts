/**
 * Voice input plugin, browser half: a mic button in the conversation input's
 * right tool row. Records through getUserMedia, streams re-transcriptions
 * while speaking, and punctuates on stop through the
 * `@deepseek-ai/dsh-voice-input` Remote.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated Remote API and ctx.remote merge through the Client assembly boundary.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the ui-conversation SlotMap merge (the input.right seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { VoiceInputButton } from './VoiceInputButton.tsx'

/** Required services: the slot registry and the mounted voiceInput Remote namespace. */
export const inject = ['slots', 'remote', 'remote.voiceInput']

/**
 * Client plugin body: register the mic button into the composer's right tool
 * row once the slot declarer and the voiceInput Remote are both ready.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.input.right', () => {
    const dispose = ctx.slots.register({
      name: 'conversation.input.right',
      id: 'voice-input',
      order: 100,
      label: '语音输入',
      inject: () => ({ remote: ctx.remote.voiceInput }),
    }, VoiceInputButton)
    return dispose
  })
}
