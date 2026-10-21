import type { BitrateDecision } from './BitrateDecision.ts'
import type { BolaState } from './BolaState.ts'

/**
 * The result of one `select` call of the BOLA selector.
 * It has the `index` and the `delay` of every selector, plus the state of BOLA.
 *
 * @beta
 */
export type BolaDecision = BitrateDecision & {
	/**
	 * The state of the selector after the call.
	 */
	readonly state: BolaState;

	/**
	 * The placeholder buffer, in seconds, after the call.
	 * The selector adds it to the real buffer level to get the effective buffer.
	 */
	readonly placeholder: number;
};
