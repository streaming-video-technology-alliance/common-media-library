import { getId3Data } from '@svta.org/common-media-library';
import { assert } from 'node:console';
import { describe, it } from 'node:test';
import { PTS } from './data/PTS.js';

describe('getId3Data', () => {
	it('gets data', () => {
		assert(getId3Data(PTS, 0) instanceof Uint8Array);
	});
});
