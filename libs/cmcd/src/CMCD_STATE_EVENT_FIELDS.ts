import {
	CMCD_EVENT_BACKGROUNDED_MODE,
	CMCD_EVENT_BITRATE_CHANGE,
	CMCD_EVENT_CONTENT_ID,
	CMCD_EVENT_PLAY_STATE,
	CMCD_EVENT_PLAYBACK_RATE,
	type CmcdEventType,
} from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * Maps each state-change event type to the persistent field whose value
 * the event signals.
 *
 * Per CTA-5004-B, the state-change events `ps`, `pr`, `c`, `b`, `bc` are
 * state-transition markers and must carry the field whose value they signal.
 * Consumers force-include the field post-filter (`prepareCmcdData`), dedup
 * against its value (`CmcdReporter`), and check its presence in payloads
 * (`validateCmcdStructure`).
 *
 * Iteration order is load-bearing: `CmcdReporter.update()` fires state-change
 * events in map order when multiple tracked fields change in a single call.
 * Do not reorder entries without auditing reporter behavior.
 *
 * @internal
 */
export const CMCD_STATE_EVENT_FIELDS: ReadonlyMap<CmcdEventType, CmcdKey> = new Map([
	[CMCD_EVENT_PLAY_STATE, 'sta'],
	[CMCD_EVENT_PLAYBACK_RATE, 'pr'],
	[CMCD_EVENT_CONTENT_ID, 'cid'],
	[CMCD_EVENT_BACKGROUNDED_MODE, 'bg'],
	[CMCD_EVENT_BITRATE_CHANGE, 'br'],
])
