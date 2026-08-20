/** Package-owned durable-message invariants for vision fallback. */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name for the invariant companion. */
export declare const name = "vision-fallback-invariant";
/** Service required before this companion can reserve package ownership. */
export declare const inject: string[];
/** Register the vision-fallback invariant companion. */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map