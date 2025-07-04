import { fromCmcdHeaders } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_HEADERS } from './data/CMCD_HEADERS.ts';
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.ts';

describe('fromCmcdHeaders', () => {
	it('produces CMCD object', () => {
		deepEqual(fromCmcdHeaders(CMCD_HEADERS), CMCD_OUTPUT);
	});
});


// actual:   { br: 200, 'com.example-hello': 'world', d: 325, ot: 'm', tb: 5000, bl: 5000, 'com.example-quote': '"Quote"', 'com.example-token': 's', dl: 10000, mtp: 10000, nor: '../testing/3.m4v', nrr: '0-99', su: true, cid: 'content-id', 'com.example-testing': 1234, msd: 2500, sf: 'd', sid: 'session-id', st: 'v', v: 2, bs: true, 'com.example-exists': true, rtp: 8000 },
// expected: { 'com.example-exists': true, 'com.example-hello': 'world', 'com.example-quote': '"Quote"', 'com.example-testing': 1234, 'com.example-token': 's', bl: 5000, br: 200, bs: true, cid: 'content-id', d: 325, dl: 10000, mtp: 10000, nor: '../testing/3.m4v', nrr: '0-99', ot: 'm', rtp: 8000, sf: 'd', sid: 'session-id', st: 'v', su: true, tb: 5000 },
