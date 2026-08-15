//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-voice-input/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-voice-input";
/** Cordis companion plugin name. */
const name = "voice-input-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: every transcription is a stateless subprocess call. */
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
