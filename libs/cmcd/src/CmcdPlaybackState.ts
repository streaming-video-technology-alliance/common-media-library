import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestProvenance } from './CmcdRequestProvenance.ts'

/**
 * The playback id of the reporter's own (root) playback. Children mint
 * distinct ids; records without a pid resolve to the root snapshot.
 */
export const CMCD_ROOT_PID = 'root'

/**
 * Tracked state field owned by a playback (dedup + auto-trigger).
 * `bg` is deliberately absent: its value and baseline are session-owned.
 */
export type CmcdStateField = 'sta' | 'pr' | 'cid' | 'br'

/**
 * The state owned by one playback: its persistent data store, its base
 * provenance record, and its state-change dedup baseline. Session-scoped
 * state (counters, gates, queues, bg) lives on the session; see the
 * child-reporters RFC state partition.
 */
export type CmcdPlaybackState = {
	pid: string;
	/** The ledger epoch this playback last observed; lazy baseline reset. */
	epoch: number;
	data: Cmcd;
	provenance: CmcdRequestProvenance;
	lastEmitted: Partial<Pick<Cmcd, CmcdStateField>>;
}

/**
 * Mints a session's frozen base provenance record: the issuing `sid`, and
 * the `cid` in effect at mint time. `update()` re-mints on every `cid`
 * change, so requests issued before a mid-session content change keep the
 * `cid` they were issued under while later requests carry the new one.
 */
export function mintProvenance(sid: string, cid: string | undefined): CmcdRequestProvenance {
	return Object.freeze(typeof cid === 'string' && cid ? { sid, cid } : { sid })
}

export function createCmcdPlaybackState(pid: string, sid: string, epoch: number, data: Cmcd): CmcdPlaybackState {
	return { pid, epoch, data, provenance: mintProvenance(sid, data.cid), lastEmitted: {} }
}
