/**
 * Voice input plugin, node half. The transcription work lives in
 * `@deepseek-ai/dsh-voice-input`; this empty apply exists so the plugin
 * appears in the host cordis.yml / Loader, while the browser half ships via
 * exports["./client"] and is discovered through the package.json dsh.client
 * declaration.
 */

/** Host plugin body — no host-side behavior for the voice input button. */
export function apply(): void {}
