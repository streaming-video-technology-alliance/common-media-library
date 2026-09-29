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
 * `prepareCmcdData` force-includes the field after filtering.
 * `CmcdReporter` deduplicates events against the field value. It drops an
 * event whose field has no value and restores the field if a transform
 * removes it.
 *
 * Sending the field with each state-change event is a library choice.
 * CTA-5004-B requires the field only on the `ps` event, which MUST carry
 * `sta`. CTA-5004-B states no such rule for `pr`, `c`, or `bc`. It defines
 * a `b` event without `bg` as the exit from backgrounded mode.
 * `validateCmcdStructure` follows CTA-5004-B and does not read this map.
 *
 * Iteration order matters: `CmcdReporter.update()` records state-change
 * events in map order when several tracked fields change in one call.
 * Do not reorder entries without auditing reporter behavior.
 *
 * @internal
 */
export const CMCD_STATE_EVENT_FIELDS: ReadonlyMap<CmcdEventType, CmcdKey> = /* @__PURE__ */ new Map([
	[CMCD_EVENT_PLAY_STATE, 'sta'],
	[CMCD_EVENT_PLAYBACK_RATE, 'pr'],
	[CMCD_EVENT_CONTENT_ID, 'cid'],
	[CMCD_EVENT_BACKGROUNDED_MODE, 'bg'],
	[CMCD_EVENT_BITRATE_CHANGE, 'br'],
])
