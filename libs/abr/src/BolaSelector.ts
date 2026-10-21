import type { BitrateSelector } from './BitrateSelector.ts'
import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import type { BolaDecision } from './BolaDecision.ts'

/**
 * A BOLA bitrate selector.
 *
 * The type has the members of `BitrateSelector`. Its `select` returns a `BolaDecision`.
 * A `BolaDecision` adds the state and the placeholder buffer.
 * The type omits the `select` of `BitrateSelector` and does not intersect with it.
 * An intersection of two `select` signatures resolves to the first one, and that hides the added fields.
 * Every `BolaSelector` is also a `BitrateSelector`.
 *
 * @beta
 */
export type BolaSelector = Omit<BitrateSelector, 'select'> & {
	/**
	 * Chooses the rung of the next segment from the buffer level.
	 *
	 * The player calls this method after the `sample` of the previous segment. It calls it before the next request, not during a download.
	 * When the decision has a delay, the player waits and calls this method again.
	 * When the buffer drained during the wait, the second call returns a delay of 0.
	 * When the buffer did not drain, for example in a paused player, the second call returns the delay again.
	 *
	 * @param input - The ladder, the buffer level, the throughput estimate, and the optional buffer target and segment duration
	 * @returns The position of the chosen rung in `input.ladder`, the delay, the state, and the placeholder buffer
	 * @throws RangeError when the ladder is empty or has a bandwidth that is not a positive finite number
	 * @throws RangeError when the ladder is not in ascending order of bandwidth
	 * @throws RangeError when `input.bufferTarget` is not a positive finite number
	 */
	select(input: BitrateSelectorInput): BolaDecision;
};
