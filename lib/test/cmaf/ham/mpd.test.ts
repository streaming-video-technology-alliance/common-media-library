import { mpdToHam } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { dash1 } from './data/dash1.js';

describe('mpd2ham', async () => {
	const ham1 = await mpdToHam(dash1);

	it('converts dash1 to ham', () => {
		deepEqual(ham1, {});
	});
});
