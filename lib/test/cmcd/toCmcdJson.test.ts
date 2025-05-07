import { toCmcdJson } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_INPUT } from './data/CMCD_INPUT.ts';

describe('toCmcdJson', () => {
	it('produces json', () => {
		equal(toCmcdJson(CMCD_INPUT), '{"br":200,"bs":true,"cid":"content-id","com.example-exists":true,"com.example-hello":"world","com.example-quote":"\\"Quote\\"","com.example-testing":1234,"com.example-token":"s","d":325,"mtp":10000,"nor":"..%2Ftesting%2F3.m4v","nrr":"0-99","ot":"m","sid":"session-id"}');
	});

	it('handles empty data', () => {
		equal(toCmcdJson(null as any), '{}');
	});
});
