import type { CmcdData } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdObjectType, CmcdPlayerState, CmcdStreamingFormat, CmcdStreamType } from '@svta/cml-cmcd'

export const CMCD_INPUT: CmcdData = {
	// common keys
	sid: 'session-id',
	cid: 'content-id',
	cdn: 'cdn-provider',
	nrr: '0-99',
	mtp: 10049,
	bs: true,
	br: 200,
	v: 2,
	pr: 1,
	pb: 1000,
	tb: 5000,
	bl: 5000,
	sf: CmcdStreamingFormat.DASH,
	st: CmcdStreamType.VOD,
	bsd: 2000,
	cs: '123456',
	dfa: 5,
	ec: ['ERR001', 'ERR002'],
	lab: 200,
	lb: 100,
	ltc: 1500,
	msd: 2500,
	pt: 45000,
	sn: 1,
	sta: CmcdPlayerState.PLAYING,
	tab: 3000,
	tbl: 8000,
	tpb: 4000,
	ts: 1640995200000,

	// request keys
	ab: 2500,
	bg: true,
	dl: 10000,
	d: 324.69,
	nor: '../testing/3.m4v',
	ot: CmcdObjectType.MANIFEST,
	rtp: 8000,
	su: true,

	// event keys
	e: CmcdEventType.TIME_INTERVAL,

	// response keys
	rc: 200,
	ttfb: 150,
	ttfbb: 200,
	ttlb: 500,
	url: 'https://example.com/media/segment.m4s',
	cmsdd: 'base64-encoded-cmsd-dynamic-data',
	cmsds: 'base64-encoded-cmsd-static-data',
	smrt: '12345',

	// custom keys
	['com.example-hello']: 'world',
	['com.example-testing']: 1234,
	['com.example-exists']: true,
	['com.example-not-exists']: false,
	['com.example-token']: Symbol('s'),
	['com.example-quote']: '"Quote"',
}
