import { hamToMpd, mpdToHam, Presentation } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import jsonHam0 from './data/ham-samples/ham0.json' assert { type: 'json' };
import jsonHam1 from './data/ham-samples/ham1.json' assert { type: 'json' };
import jsonHam2 from './data/ham-samples/ham2.json' assert { type: 'json' };
import jsonHam3 from './data/ham-samples/ham3.json' assert { type: 'json' };
import jsonHam4 from './data/ham-samples/ham4.json' assert { type: 'json' };
import jsonHam5 from './data/ham-samples/ham5.json' assert { type: 'json' };
import jsonHam6 from './data/ham-samples/ham6.json' assert { type: 'json' };
import jsonHam7 from './data/ham-samples/ham7.json' assert { type: 'json' };
import jsonHam8 from './data/ham-samples/ham8.json' assert { type: 'json' };
import { mpdSample0 } from './data/dash-samples/mpdSample0.js';
import { mpdSample1 } from './data/dash-samples/mpdSample1.js';
import { mpdSample2 } from './data/dash-samples/mpdSample2.js';
import { mpdSample3 } from './data/dash-samples/mpdSample3.js';
import { mpdSample4 } from './data/dash-samples/mpdSample4.js';
import { mpdSample5 } from './data/dash-samples/mpdSample5.js';
import { mpdSample6 } from './data/dash-samples/mpdSample6.js';
import { mpdSample7 } from './data/dash-samples/mpdSample7.js';
import { mpdSample8 } from './data/dash-samples/mpdSample8.js';

describe('mpd2ham', () => {
	it('converts dash1 to ham1', () => {
		const convertedHam0 = mpdToHam(mpdSample0);
		deepEqual(convertedHam0, jsonHam0);
	});

	it('converts mpdSample1 to HAM', () => {
		const convertedHam1 = mpdToHam(mpdSample1);
		deepEqual(convertedHam1, jsonHam1);
	});

	it('converts mpdSample2 to HAM', () => {
		const convertedHam2 = mpdToHam(mpdSample2);
		deepEqual(convertedHam2, jsonHam2);
	});

	it('converts mpdSample3 to HAM', () => {
		const convertedHam3 = mpdToHam(mpdSample3);
		deepEqual(convertedHam3, jsonHam3);
	});

	it('converts mpdSample4 to HAM', () => {
		const convertedHam4 = mpdToHam(mpdSample4);
		deepEqual(convertedHam4, jsonHam4);
	});

	it('converts mpdSample5 to HAM', () => {
		const convertedHam5 = mpdToHam(mpdSample5);
		deepEqual(convertedHam5, jsonHam5);
	});

	it('converts mpdSample6 to HAM', () => {
		const convertedHam6 = mpdToHam(mpdSample6);
		deepEqual(convertedHam6, jsonHam6);
	});

	it('converts mpdSample7 to HAM', () => {
		const convertedHam7 = mpdToHam(mpdSample7);
		deepEqual(convertedHam7, jsonHam7);
	});

	it('converts mpdSample8 to HAM', () => {
		const convertedHam8 = mpdToHam(mpdSample8);
		deepEqual(convertedHam8, jsonHam8);
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
