import { mapMpd, Presentation } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import jsonHam1 from './data/ham1.json' assert { type: 'json' };
import { dash1 } from './data/dash1.js';
import { mpdSample1 } from './data/dash-samples/mpdSample1.js';
import { mpdSample2 } from './data/dash-samples/mpdSample2.js';
// import { mpdSample3 } from './data/dash-samples/mpdSample3.js';
// import { mpdSample4 } from './data/dash-samples/mpdSample4.js';

describe('mpd2ham', () => {
	const convertedHam = mapMpd.toHam(dash1);
	const convertedHam1 = mapMpd.toHam(mpdSample1);
	const convertedHam2 = mapMpd.toHam(mpdSample2);
	// const convertedHam3 = mapMpd.toHam(mpdSample3);
	// const convertedHam4 = mapMpd.toHam(mpdSample4);

	it('converts dash1 to ham1', () => {
		deepEqual(convertedHam, jsonHam1);
	});

	it('converts mpdSample1 to HAM', () => {
		deepEqual(convertedHam1, jsonHam1);
	});

	it('converts mpdSample2 to HAM', () => {
		deepEqual(convertedHam2, jsonHam1);
	});
	//
	// it.skip('converts mpdSample3 to HAM', () => {
	// 	deepEqual(convertedHam3, jsonHam1);
	// });
	//
	// it.skip('converts mpdSample4 to HAM', () => {
	// 	deepEqual(convertedHam4, jsonHam1);
	// });
});

describe('ham2mpd', async () => {
	const presentation = jsonHam1 as Presentation;
	const convertedMpd = await mapMpd.fromHam([presentation]);

	// FIXME: the xml is missing some of the original metadata
	it.skip('converts ham1 to dash1', () => {
		deepEqual(convertedMpd, dash1);
	});
});
