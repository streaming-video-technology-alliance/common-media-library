import { getId3Data } from '@svta/common-media-library/id3/getId3Data';
import { assert } from 'node:console';
import { describe, it } from 'node:test';
import { PTS } from './data/PTS.ts';

describe('getId3Data', () => {
	it('gets data', () => {
		assert(getId3Data(PTS, 0) instanceof Uint8Array);
	});
});
