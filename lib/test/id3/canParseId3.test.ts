import { canParseId3 } from '@svta.org/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { PTS } from './data/PTS.js';

describe('canParseId3', () => {
	it('detects valid ID3', () => {
		equal(canParseId3(PTS, 0), true);
	});

	it('detects invalid ID3', () => {
		equal(canParseId3(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 0), false);
	});
});
