import { hamToMpd, mpdToHam, Presentation } from '@svta/common-media-library';
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
} from './data/ham-samples/index.js';
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
	// FIXME: the xml is missing some of the original metadata
	it.skip('converts ham1 to dash1', () => {
		const presentations = jsonHam1 as Presentation[];
		const convertedMpd = hamToMpd(presentations);
		deepEqual(convertedMpd.manifest, mpdSample1);
		equal(convertedMpd.type, 'mpd');
		equal(convertedMpd.ancillaryManifests, []);
	});

	it.skip('converts ham5 to dash5', () => {
		const presentations = jsonHam5 as Presentation[];
		const convertedMpd = hamToMpd(presentations);
		deepEqual(convertedMpd.manifest, mpdSample5);
		equal(convertedMpd.type, 'mpd');
		equal(convertedMpd.ancillaryManifests, []);
	});
});
