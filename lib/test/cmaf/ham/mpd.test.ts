import { mpdToHam, hamToMPD, Presentation } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { dash1 } from './data/dash1.js';
import jsonHam1 from './data/ham1.json' assert { type: 'json' };

describe('mpd2ham', async () => {
	const convertedHam = await mpdToHam(dash1);

	it('converts dash1 to ham1', () => {
		deepEqual(convertedHam, jsonHam1);
	});
});

describe('ham2mpd', async () => {
	const presentation = jsonHam1 as Presentation;
	const convertedMpd = await hamToMPD([presentation]);

	// FIXME: this test throws an error because the strings have different spaces and indentation
	it.skip('converts ham1 to dash1', () => {
		deepEqual(convertedMpd, JSON.parse(dash1));
	});
});
