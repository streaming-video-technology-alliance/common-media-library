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

describe('ham2dash', async () => {
	// FIXME: the xml is missing some of the original metadata
	it.skip('converts ham1 to dash1', () => {
		const presentations = jsonHam1 as Presentation[];
		const converteddash = cmafHam.hamToDash(presentations);
		deepEqual(converteddash.manifest, mpdSample1);
		equal(converteddash.type, 'mpd');
		equal(converteddash.ancillaryManifests, []);
	});

	it.skip('converts ham5 to dash5', () => {
		const presentations = jsonHam5 as Presentation[];
		const convertedDash = cmafHam.hamToDash(presentations);
		deepEqual(convertedDash.manifest, mpdSample5);
		equal(convertedDash.type, 'mpd');
		equal(convertedDash.ancillaryManifests, []);
	});
});

describe.skip('dash to ham to dash', async () => {
	it('converts ham5 to dash5 to ham5 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample5);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample5);
	});

	it('converts ham6 to dash6 to ham6 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample6);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample6);
	});

	it('converts ham7 to dash7 to ham7 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample7);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample7);
	});

	it('converts ham8 to dash8 to ham8 again', () => {
		const convertedHam = cmafHam.dashToHam(mpdSample8);
		const convertedDash = cmafHam.hamToDash(convertedHam);
		deepEqual(convertedDash.manifest, mpdSample8);
	});
});
