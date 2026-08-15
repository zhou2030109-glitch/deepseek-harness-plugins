/**
 * Voice input button: records 16 kHz mono PCM through getUserMedia, encodes to
 * WAV base64, streams re-transcriptions of the growing buffer to the composer
 * draft, and punctuates on stop via the voiceInput Remote.
 */
import React from 'react';
/** The voiceInput Remote namespace face this component consumes. */
interface VoiceInputRemote {
    transcribe(request: {
        b64: string;
        final: boolean;
    }): Promise<{
        ok: true;
        value: {
            text: string;
            error?: string;
        };
    } | {
        ok: false;
        error: {
            code: string;
            message: string;
            details: object;
        };
    }>;
}
/** Minimal structural share of the composer input actions this component drives. */
interface VoiceInputActions {
    setDraft(text: string): void;
}
interface VoiceInputButtonProps {
    remote: VoiceInputRemote;
    useInput: (selector: (state: {
        draft: string;
    }) => string) => string;
    inputActions: VoiceInputActions;
}
export declare function VoiceInputButton(props: VoiceInputButtonProps): React.ReactElement;
export {};
//# sourceMappingURL=VoiceInputButton.d.ts.map