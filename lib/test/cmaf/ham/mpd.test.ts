import { mpdToHam, hamToMpd, Presentation } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { dash1 } from './data/dash1.js';
import { ham1 } from './data/ham1.js';

describe('mpd2ham', async () => {
	const convertedHam = await mpdToHam(dash1);

	it('converts dash1 to ham', () => {
		deepEqual(convertedHam?.toString(), JSON.stringify(ham1));
	});
});

describe('ham2mpd', async () => {
	const presentation = Presentation.fromJSON(ham1);
	const convertedMpd = await hamToMpd(presentation);

	it('converts dash1 to ham', () => {
		deepEqual(convertedMpd?.toString(), JSON.stringify(dash1));
	});
});
