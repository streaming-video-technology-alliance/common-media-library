import { readId3Size } from '@svta/cml-id3/util/readId3Size';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('readId3Size', () => {
	const mockID3SizeData = Uint8Array.from([73, 68, 51, 4, 0, 0, 0, 7, 1, 0]);
	it('returns Id3 size', () => {
		equal(readId3Size(mockID3SizeData, 6), 114816);
	});
});
