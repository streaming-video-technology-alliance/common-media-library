import type { ValueOf } from '@svta/cml-utils'

/**
 * The state of the BOLA selector.
 *
 * @enum
 *
 * @beta
 */
export const BolaState = {
	/**
	 * The selector has not loaded a segment yet, or the player reset it.
	 * The selector picks from the throughput estimate and sets the placeholder buffer.
	 */
	STARTUP: 'startup',

	/**
	 * The selector picks from the buffer level, with the placeholder buffer added to it.
	 */
	STEADY: 'steady',
} as const

/**
 * @beta
 */
export type BolaState = ValueOf<typeof BolaState>
