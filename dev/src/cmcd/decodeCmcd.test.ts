import { decodeCmcd } from '@svta.org/common-media-library/cmcd/decodeCmcd';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { cmcdString } from './cmcdString.js';

describe('decodeCmcd', () => {
	it('handles null data object', () => {
		deepEqual(decodeCmcd(null as any), {});
	});

	it('handles empty string', () => {
		deepEqual(decodeCmcd(''), {});
	});

	it('returns encoded string', () => {
		deepEqual(decodeCmcd(cmcdString), {
			'com.example-exists': true,
			'com.example-hello': 'world',
			'com.example-quote': '"Quote"',
			'com.example-testing': 1234,
			'com.example-token': 's',
			br: 200,
			bs: true,
			cid: 'content-id',
			d: 325,
			mtp: 10000,
			nor: '../testing/3.m4v',
			nrr: '0-99',
			ot: 'm',
			sid: 'session-id',
		});
	});
});
