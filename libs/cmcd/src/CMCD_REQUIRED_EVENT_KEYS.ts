import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED, type CmcdEventType } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * Maps each event type to the key CTA-5004-B requires beyond `e` and `ts`.
 * Built from the state-change table plus the three event types whose
 * required key rides the caller's per-event data.
 */
export const CMCD_REQUIRED_EVENT_KEYS: ReadonlyMap<CmcdEventType, CmcdKey> = /* @__PURE__ */ new Map([
	.../* @__PURE__ */ CMCD_STATE_EVENT_FIELDS,
	[CMCD_EVENT_CUSTOM_EVENT, 'cen'] as const,
	[CMCD_EVENT_ERROR, 'ec'] as const,
	[CMCD_EVENT_RESPONSE_RECEIVED, 'url'] as const,
])
