import type { CmcdData } from '@svta/common-media-library/cmcd';
import { CmcdObjectType } from '@svta/common-media-library/cmcd';

export const CMCD_INPUT: CmcdData = {
	sid: 'session-id',
	cid: 'content-id',
	su: false,
	nor: '../testing/3.m4v',
	nrr: '0-99',
	d: 324.69,
	mtp: 10049,
	bs: true,
	br: 200,
	v: 1,
	pr: 1,
	pb: 1000,
	ot: CmcdObjectType.MANIFEST,
	// custom data
	['com.example-hello']: 'world',
	['com.example-testing']: 1234,
	['com.example-exists']: true,
	['com.example-not-exists']: false,
	['com.example-token']: Symbol('s'),
	['com.example-quote']: '"Quote"',
};
