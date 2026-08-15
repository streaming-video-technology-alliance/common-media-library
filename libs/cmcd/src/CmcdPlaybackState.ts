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
	/**
	 * Frozen base provenance record for this playback: the `sid` of the
	 * session it reports into, and the `cid` in effect when the record was
	 * minted. Stamped under {@link CMCD_REQUEST_PROVENANCE} on every request
	 * the reporter returns; a request created with per-call data carries a
	 * per-request record extending it with that data encoded. Re-minted by
	 * `update()` whenever this playback's `cid` changes, so records are
	 * request-time truth: already-issued requests keep the record they were
	 * stamped with. Attribution reads the record's `sid`; see
	 * `CmcdSessionLedger.resolve()`.
	 */
	provenance: CmcdRequestProvenance;
	lastEmitted: Partial<Pick<Cmcd, CmcdStateField>>;
}

/**
 * Mints a playback's frozen base provenance record: the issuing `sid`, and
 * the `cid` in effect at mint time. `update()` re-mints on every `cid`
 * change, so requests issued before a mid-session content change keep the
 * `cid` they were issued under while later requests carry the new one.
 */
export function mintProvenance(sid: string, cid: string | undefined): CmcdRequestProvenance {
	return Object.freeze(typeof cid === 'string' && cid ? { sid, cid } : { sid })
}

/**
 * Creates the state for a playback reporting into `sid`: the given data as
 * its persistent store, a freshly minted base provenance record, and an
 * empty dedup baseline.
 */
export function createCmcdPlaybackState(pid: string, sid: string, epoch: number, data: Cmcd): CmcdPlaybackState {
	return {
		pid,
		epoch,
		data,
		// Frozen because it is handed out on every returned request; the
		// sid value, not the record's identity, is what attributes.
		provenance: mintProvenance(sid, data.cid),
		lastEmitted: {},
	}
}
