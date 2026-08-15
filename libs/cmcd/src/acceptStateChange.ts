import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
import type { CmcdPlaybackState, CmcdStateField } from './CmcdPlaybackState.ts'

/**
 * One row in the CMCD_STATE_FIELDS dispatch table.
 *
 * `snapshot` captures the value stored in `lastEmitted` for dedup
 * comparisons. Reference types must clone so the baseline doesn't
 * share a reference with the caller's input, which would let in-place
 * mutation silently poison the dedup state.
 */
export type CmcdStateFieldEntry = {
	field: CmcdStateField | 'bg'
	event: CmcdEventType
	equal: (a: unknown, b: unknown) => boolean
	snapshot: (v: unknown) => unknown
}

/**
 * The `bg` value and dedup baseline a session owns. `bg` is session-scoped
 * rather than playback-scoped, so it is passed alongside the playback state
 * rather than read from it.
 */
export type CmcdBgState = {
	bg?: boolean;
	bgEmitted?: boolean;
}

/**
 * Deep equality for CmcdObjectTypeList (used for `br` dedup).
 *
 * Order-sensitive: arrays with the same elements in different positions
 * are treated as different. Players that construct `br` consistently
 * get correct dedup; shuffling produces spurious emits, which is the
 * safer failure mode.
 */
function cmcdObjectTypeListEqual(a: CmcdObjectTypeList, b: CmcdObjectTypeList): boolean {
	if (a === b) return true
	if (a.length !== b.length) return false

	for (let i = 0; i < a.length; i++) {
		const ai = a[i]
		const bi = b[i]
		if (ai === bi) continue
		if (typeof ai === 'number' || typeof bi === 'number') return false

		// Both are SfItem<number, ExclusiveRecord<CmcdObjectType, boolean>>
		if (ai.value !== bi.value) return false

		// ExclusiveRecord: params (when defined) has exactly one key
		const ap = ai.params
		const bp = bi.params
		const ak = ap && Object.keys(ap)[0]
		const bk = bp && Object.keys(bp)[0]
		if (ak !== bk) return false
		if (ak !== undefined && bk !== undefined && ap && bp && ap[ak as keyof typeof ap] !== bp[bk as keyof typeof bp]) return false
	}

	return true
}

const equal = Object.is
const identity = <T>(v: T): T => v

/**
 * Maps each tracked state field to its event type and equality function.
 * Order matters: `update()` fires events in this order for multi-field updates.
 */
export const CMCD_STATE_FIELDS: readonly CmcdStateFieldEntry[] = /* @__PURE__ */ Array.from(
	CMCD_STATE_EVENT_FIELDS,
	([event, field]): CmcdStateFieldEntry => {
		if (field === 'br') {
			return {
				event,
				field,
				equal: (a, b) => (a === undefined || b === undefined) ? a === b : cmcdObjectTypeListEqual(a as CmcdObjectTypeList, b as CmcdObjectTypeList),
				snapshot: (v) => (v as CmcdObjectTypeList).slice(),
			}
		}
		return { event, field: field as CmcdStateField | 'bg', equal, snapshot: identity }
	},
)

const STATE_FIELDS_BY_EVENT: ReadonlyMap<CmcdEventType, CmcdStateFieldEntry> = /* @__PURE__ */ new Map(
	/* @__PURE__ */ CMCD_STATE_FIELDS.map(e => [e.event, e]),
)

/**
 * Applies state-change dedup for one event, returning whether the event may
 * be emitted. For a state-change event this:
 * 1. Persists the dedup field from `data` (if present) into the owning
 *    store — the playback's data for `sta`, `pr`, `cid` and `br`, the
 *    session's `bg` for `bg`.
 * 2. Rejects the event if the dedup field has no value after the
 *    write-through (never set, or cleared via `update({ field: undefined })`).
 * 3. Rejects the event if the field's current value matches the
 *    last-emitted value (no state transition), and otherwise commits the
 *    new baseline.
 *
 * Non-state events are always accepted, and touch neither store.
 *
 * @param playback - The playback whose data store and dedup baseline own the
 *                   `sta`, `pr`, `cid` and `br` fields.
 * @param session - The session that owns `bg` and its dedup baseline.
 * @param type - The type of event being recorded.
 * @param data - Additional data recorded with the event.
 * @returns `true` when the event may be emitted, `false` to suppress it.
 */
export function acceptStateChange(playback: CmcdPlaybackState, session: CmcdBgState, type: CmcdEventType, data: Partial<Cmcd>): boolean {
	const entry = STATE_FIELDS_BY_EVENT.get(type)

	if (!entry) {
		return true
	}

	const field = entry.field
	const incoming = data[field]

	if (field === 'bg') {
		if (incoming !== undefined) {
			session.bg = incoming as boolean
		}

		if (session.bg === undefined || session.bg === session.bgEmitted) {
			return false
		}

		session.bgEmitted = session.bg
		return true
	}

	if (incoming !== undefined) {
		Object.assign(playback.data, { [field]: incoming })
	}

	const current = playback.data[field]

	// Never emit a state-change event with a missing required field — per
	// CTA-5004-B these events must carry their dedup field. Catches both
	// "no value ever set" and "previous value was cleared to undefined".
	if (current === undefined) {
		return false
	}

	if (entry.equal(current, playback.lastEmitted[field])) {
		return false
	}

	Object.assign(playback.lastEmitted, { [field]: entry.snapshot(current) })
	return true
}
