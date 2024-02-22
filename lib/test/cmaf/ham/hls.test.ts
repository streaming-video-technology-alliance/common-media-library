import { m3u8toHam } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { dash1 } from './data/dash1.js';
import { ham1 } from './data/ham1.js';

describe('hlstoHam', async () => {
	const convertedHam = await mpdToHam(dash1);

	it('converts dash1 to ham', () => {
		deepEqual(convertedHam?.toString(), JSON.stringify(ham1));
	});
});
