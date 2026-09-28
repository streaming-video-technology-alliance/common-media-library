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
 * state-transition markers. Each event must include the field whose value
 * it signals. Callers force-include the field after filtering
 * (`prepareCmcdData`), deduplicate against its value (`CmcdReporter`), and
 * check its presence in payloads (`validateCmcdStructure`).
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
