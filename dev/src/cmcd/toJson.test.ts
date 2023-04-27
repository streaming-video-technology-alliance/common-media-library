import { toJson } from '@svta.org/common-media-library/cmcd/toJson';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { data } from './data.js';

describe('CMCD JSON serialization', () => {
	it('produces json', () => {
		equal(toJson(data), '{"br":200,"bs":true,"cid":"content-id","com.example-exists":true,"com.example-hello":"world","com.example-quote":"\\"Quote\\"","com.example-testing":1234,"com.example-token":"s","d":325,"mtp":10049,"nor":"..%2Ftesting%2F3.m4v","nrr":"0-99","ot":"m","sid":"session-id"}');
	});

	it('handles empty data', () => {
		equal(toJson(null as any), '{}');
	});
});
