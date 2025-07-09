import { CMCD_OBJECT } from './CMCD_OBJECT.js';
import { CMCD_REQUEST } from './CMCD_REQUEST.js';
import { CMCD_SESSION } from './CMCD_SESSION.js';
import { CMCD_STATUS } from './CMCD_STATUS.js';
import type { CmcdHeaderField } from './CmcdHeaderField.js';
import type { CmcdKey } from './CmcdKey.js';

/**
 * The map of CMCD keys to their appropriate header shard.
 *
 * @group CMCD
 *
 * @internal
 */
export const CMCD_HEADER_MAP: Record<CmcdKey, CmcdHeaderField> = {
	// Object
	br: CMCD_OBJECT,
	ab: CMCD_OBJECT,
	d: CMCD_OBJECT,
	ot: CMCD_OBJECT,
	tb: CMCD_OBJECT,
	tpb: CMCD_OBJECT,
	lb: CMCD_OBJECT,
	tab: CMCD_OBJECT,
	lab: CMCD_OBJECT,
	url: CMCD_OBJECT,

	// Request
	pb: CMCD_REQUEST,
	bl: CMCD_REQUEST,
	tbl: CMCD_REQUEST,
	dl: CMCD_REQUEST,
	ltc: CMCD_REQUEST,
	mtp: CMCD_REQUEST,
	nor: CMCD_REQUEST,
	nrr: CMCD_REQUEST,
	rc: CMCD_REQUEST,
	sn: CMCD_REQUEST,
	sta: CMCD_REQUEST,
	su: CMCD_REQUEST,
	ttfb: CMCD_REQUEST,
	ttfbb: CMCD_REQUEST,
	ttlb: CMCD_REQUEST,
	cmsdd: CMCD_REQUEST,
	cmsds: CMCD_REQUEST,
	smrt: CMCD_REQUEST,
	df: CMCD_REQUEST,
	cs: CMCD_REQUEST,

	// TODO: Which header to put the `ts` field is not defined yet.
	ts: CMCD_REQUEST,

	// Session
	cid: CMCD_SESSION,
	pr: CMCD_SESSION,
	sf: CMCD_SESSION,
	sid: CMCD_SESSION,
	st: CMCD_SESSION,
	v: CMCD_SESSION,
	msd: CMCD_SESSION,

	// Status
	bs: CMCD_STATUS,
	bsd: CMCD_STATUS,
	cdn: CMCD_STATUS,
	rtp: CMCD_STATUS,
	bg: CMCD_STATUS,
	pt: CMCD_STATUS,
	ec: CMCD_STATUS,
	e: CMCD_STATUS,
};
