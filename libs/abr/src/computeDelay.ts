// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import { NEGLIGIBLE_DELAY } from './BOLA_CONSTANTS.ts'

/**
 * Returns the delay that remains after the placeholder buffer absorbs part of an excess buffer.
 * The excess is the effective buffer above the maximum buffer of the chosen rung.
 * A remainder of `NEGLIGIBLE_DELAY` or less is 0. The call after a wait then does not return a delay for rounding error.
 *
 * @param excess - The effective buffer above the maximum buffer of the rung, in seconds. The value is 0 or more.
 * @param placeholder - The placeholder buffer in seconds
 * @returns The delay in seconds. The value is 0 or more.
 */
export function computeDelay(excess: number, placeholder: number): number {
	const remainder = excess - placeholder

	return remainder > NEGLIGIBLE_DELAY ? remainder : 0
}
