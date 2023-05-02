import { toCmcdJson } from '@svta.org/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { data } from './data.js';

describe('CMCD JSON serialization', () => {
	it('produces json', () => {
		equal(toCmcdJson(data), '{"br":200,"bs":true,"cid":"content-id","com.example-exists":true,"com.example-hello":"world","com.example-quote":"\\"Quote\\"","com.example-testing":1234,"com.example-token":"s","d":325,"mtp":10000,"nor":"..%2Ftesting%2F3.m4v","nrr":"0-99","ot":"m","sid":"session-id"}');
	});

	it('handles empty data', () => {
		equal(toCmcdJson(null as any), '{}');
	});
});
