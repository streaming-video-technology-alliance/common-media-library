import { mpdToHam, hamToMpd, Presentation } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import jsonHam0 from './data/ham-samples/ham0.json' assert { type: 'json' };
import jsonHam1 from './data/ham-samples/ham1.json' assert { type: 'json' };
import jsonHam2 from './data/ham-samples/ham2.json' assert { type: 'json' };
import jsonHam3 from './data/ham-samples/ham3.json' assert { type: 'json' };
import jsonHam4 from './data/ham-samples/ham4.json' assert { type: 'json' };
import { mpdSample0 } from './data/dash-samples/mpdSample0.js';
import { mpdSample1 } from './data/dash-samples/mpdSample1.js';
import { mpdSample2 } from './data/dash-samples/mpdSample2.js';
import { mpdSample3 } from './data/dash-samples/mpdSample3.js';
import { mpdSample4 } from './data/dash-samples/mpdSample4.js';

describe('mpd2ham', () => {
	const convertedHam0 = mpdToHam(mpdSample0);
	const convertedHam1 = mpdToHam(mpdSample1);
	const convertedHam2 = mpdToHam(mpdSample2);
	const convertedHam3 = mpdToHam(mpdSample3);
	const convertedHam4 = mpdToHam(mpdSample4);

	it('converts dash1 to ham1', () => {
		deepEqual(convertedHam0, jsonHam0);
	});

	it('converts mpdSample1 to HAM', () => {
		deepEqual(convertedHam1, jsonHam1);
	});

	it('converts mpdSample2 to HAM', () => {
		deepEqual(convertedHam2, jsonHam2);
	});

	it('converts mpdSample3 to HAM', () => {
		deepEqual(convertedHam3, jsonHam3);
	});

	it('converts mpdSample4 to HAM', () => {
		deepEqual(convertedHam4, jsonHam4);
	});
});

describe('ham2mpd', async () => {
	const presentation = jsonHam0[0] as Presentation;
	const convertedMpd = hamToMpd([presentation]);

	// FIXME: the xml is missing some of the original metadata
	it.skip('converts ham1 to dash1', () => {
		deepEqual(convertedMpd, mpdSample0);
	});
});
