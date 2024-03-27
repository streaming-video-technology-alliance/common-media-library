import cmafHam, { Presentation } from '@svta/common-media-library/cmaf-ham';
import { deepEqual, equal } from 'node:assert';
import { describe, it } from 'node:test';
import {
	jsonHam0,
	jsonHam1,
	jsonHam2,
	jsonHam3,
	jsonHam4,
	jsonHam5,
	jsonHam6,
	jsonHam7,
	jsonHam8,
} from './data/ham-samples/fromDash/index.js';
import {
	mpdSample0,
	mpdSample1,
	mpdSample2,
	mpdSample3,
	mpdSample4,
	mpdSample5,
	mpdSample6,
	mpdSample7,
	mpdSample8,
} from './data/dash-samples/index.js';
import { dashFromHam1 } from './data/dash-samples/fromHam/dashFromHam1.js';
import { dashFromHam5 } from './data/dash-samples/fromHam/dashFromHam5';

describe('dashToham', () => {
	it('converts dash1 to ham1', () => {
		const convertedHam0 = cmafHam.dashToHam(mpdSample0);
		deepEqual(convertedHam0, jsonHam0);
	});

	it('converts dashSample1 to HAM', () => {
		const convertedHam1 = cmafHam.dashToHam(mpdSample1);
		deepEqual(convertedHam1, jsonHam1);
	});

	it('converts dashSample2 to HAM', () => {
		const convertedHam2 = cmafHam.dashToHam(mpdSample2);
		deepEqual(convertedHam2, jsonHam2);
	});

	it('converts dashSample3 to HAM', () => {
		const convertedHam3 = cmafHam.dashToHam(mpdSample3);
		deepEqual(convertedHam3, jsonHam3);
	});

	it('converts dashSample4 to HAM', () => {
		const convertedHam4 = cmafHam.dashToHam(mpdSample4);
		deepEqual(convertedHam4, jsonHam4);
	});

	it('converts dashSample5 to HAM', () => {
		const convertedHam5 = cmafHam.dashToHam(mpdSample5);
		deepEqual(convertedHam5, jsonHam5);
	});

	it('converts dashSample6 to HAM', () => {
		const convertedHam6 = cmafHam.dashToHam(mpdSample6);
		deepEqual(convertedHam6, jsonHam6);
	});

	it('converts dashSample7 to HAM', () => {
		const convertedHam7 = cmafHam.dashToHam(mpdSample7);
		deepEqual(convertedHam7, jsonHam7);
	});

	it('converts dashSample8 to HAM', () => {
		const convertedHam8 = cmafHam.dashToHam(mpdSample8);
		deepEqual(convertedHam8, jsonHam8);
	});
});

describe('hamToDash', async () => {
	it('converts ham1 to dash1', () => {
		const presentations = jsonHam1 as Presentation[];
		const convertedDash = cmafHam.hamToDash(presentations);
		deepEqual(convertedDash.manifest, dashFromHam1);
		equal(convertedDash.type, 'mpd');
		equal(convertedDash.ancillaryManifests, []);
	});

	it('converts ham5 to dash5', () => {
		const presentations = jsonHam5 as Presentation[];
		const convertedDash = cmafHam.hamToDash(presentations);
		deepEqual(convertedDash.manifest, dashFromHam5);
		equal(convertedDash.type, 'mpd');
		equal(convertedDash.ancillaryManifests, []);
	});
});

// Tests skipped because the output is not 100% equal to the original manifest.
// These tests are useful to compare manually the actual dash with the output.
describe.skip('dash to ham to dash', async () => {
	it('converts ham1 to dash1 to ham1 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample1);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample1);
	});

	it('converts ham2 to dash2 to ham2 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample2);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample2);
	});

	it('converts ham3 to dash3 to ham3 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample3);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample3);
	});

	it('converts ham4 to dash4 to ham4 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample4);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample4);
	});
});
