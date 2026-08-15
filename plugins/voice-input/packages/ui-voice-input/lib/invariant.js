//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-client-ui-voice-input/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-voice-input";
/** Cordis companion plugin name. */
const name = "ui-voice-input-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: the button is a stateless composer affordance. */
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
