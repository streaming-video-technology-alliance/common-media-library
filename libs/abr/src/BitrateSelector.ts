import type { BitrateDecision } from './BitrateDecision.ts'
import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import type { SegmentSample } from './SegmentSample.ts'

/**
 * A bitrate selection algorithm.
 *
 * A player creates one selector for each media type.
 * Before every segment request, the player calls `select`.
 * After every finished or abandoned download, the player calls `sample`.
 * After a seek or a source change, the player calls `reset`.
 *
 * A selector reads the input fields it needs and ignores the rest.
 * A selector that needs an optional field and does not receive it uses a documented default.
 * A selector that keeps a current rung stores its bandwidth, not its index.
 * In each `select` call, it maps that bandwidth to the highest rung at or below it in the ladder of the call.
 * The bandwidth in `sample` is authoritative when the player loads a rung other than the decision.
 *
 * @beta
 */
export type BitrateSelector = {
	/**
	 * Chooses the rung of the next segment.
	 *
	 * The player calls this method after the `sample` of the previous segment and before the next request, not during a download.
	 * A second call before the request replaces the first decision.
	 * When a decision has a delay, the player waits and then calls this method again. The selector accounts for the wait.
	 * A selector may change its state in this call.
	 *
	 * @param input - The ladder, the buffer level, and the throughput estimate
	 * @returns The position of the chosen rung in `input.ladder`, and the delay before the next request
	 */
	select(input: BitrateSelectorInput): BitrateDecision

	/**
	 * Records a finished or abandoned download.
	 *
	 * @param segment - The download. `segment.timing` is the object the throughput estimator received.
	 */
	sample(segment: SegmentSample): void

	/**
	 * Returns the selector to its initial state.
	 */
	reset(): void
}
