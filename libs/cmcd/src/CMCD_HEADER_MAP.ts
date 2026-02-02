import { type CmcdHeaderField, CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS } from './CmcdHeaderField.ts'
import type { CmcdRequestKey } from './CmcdRequestKey.ts'

/**
 * The map of CMCD keys to their appropriate header shard.
 *
 * @internal
 */
export const CMCD_HEADER_MAP: Record<CmcdRequestKey | 'nrr', CmcdHeaderField> = {
	// Object
	ab: CMCD_OBJECT,
	br: CMCD_OBJECT,
	d: CMCD_OBJECT,
	lab: CMCD_OBJECT,
	lb: CMCD_OBJECT,
	ot: CMCD_OBJECT,
	tab: CMCD_OBJECT,
	tb: CMCD_OBJECT,
	tpb: CMCD_OBJECT,

	// Request
	bl: CMCD_REQUEST,
	cs: CMCD_REQUEST,
	dfa: CMCD_REQUEST,
	dl: CMCD_REQUEST,
	ltc: CMCD_REQUEST,
	mtp: CMCD_REQUEST,
	nor: CMCD_REQUEST,
	nrr: CMCD_REQUEST,
	pb: CMCD_REQUEST,
	sn: CMCD_REQUEST,
	sta: CMCD_REQUEST,
	su: CMCD_REQUEST,
	tbl: CMCD_REQUEST,

	// Session
	cid: CMCD_SESSION,
	msd: CMCD_SESSION,
	sf: CMCD_SESSION,
	sid: CMCD_SESSION,
	st: CMCD_SESSION,
	v: CMCD_SESSION,

	// Status
	bg: CMCD_STATUS,
	bs: CMCD_STATUS,
	bsa: CMCD_STATUS,
	bsd: CMCD_STATUS,
	bsda: CMCD_STATUS,
	cdn: CMCD_STATUS,
	ec: CMCD_STATUS,
	nr: CMCD_STATUS,
	pr: CMCD_STATUS,
	pt: CMCD_STATUS,
	rtp: CMCD_STATUS,
}
