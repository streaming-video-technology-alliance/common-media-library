import cmafHam, { Presentation } from '@svta/common-media-library/cmaf-ham';
import { deepEqual, equal } from 'node:assert';
import { describe, it } from 'node:test';
import { ham0, ham1, ham2, ham3 } from './data/ham-samples/fromHls/index.js';
import {
	hlsMain0,
	hlsMain1,
	hlsMain2,
	hlsMain3,
	hlsPlaylist0,
	hlsPlaylist1,
	hlsPlaylist2,
	hlsPlaylist3,
} from './data/hls-samples/index.js';

describe('hlsToHam', () => {
	it('converts hls0 to ham0', () => {
		const convertedHam = cmafHam.hlsToHam(hlsMain0, hlsPlaylist0);
		deepEqual(convertedHam, ham0);
	});

	it('converts hls1 to ham1', () => {
		const convertedHam = cmafHam.hlsToHam(hlsMain1, hlsPlaylist1);
		deepEqual(convertedHam, ham1);
	});

	it('converts hls2 to ham2', () => {
		const convertedHam = cmafHam.hlsToHam(hlsMain2, hlsPlaylist2);
		deepEqual(convertedHam, ham2);
	});

	it('converts hls3 to ham3', () => {
		const convertedHam = cmafHam.hlsToHam(hlsMain3, hlsPlaylist3);
		deepEqual(convertedHam, ham3);
	});
});

describe.skip('hamToHls', () => {
	// FIXME: the manifest is missing some of the original metadata
	it('converts ham0 to hls', () => {
		const presentations = ham0 as Presentation[];
		const convertedHls = cmafHam.hamToHls(presentations);
		deepEqual(convertedHls.manifest, hlsMain0);
		equal(convertedHls.type, 'hls');
		equal(convertedHls.ancillaryManifests, hlsPlaylist0);
	});

	it('converts ham1 to hls', () => {
		const presentations = ham1 as Presentation[];
		const convertedHls = cmafHam.hamToHls(presentations);
		deepEqual(convertedHls.manifest, hlsMain1);
		equal(convertedHls.type, 'hls');
		equal(convertedHls.ancillaryManifests, hlsPlaylist1);
	});

	it('converts ham2 to hls', () => {
		const presentations = ham2 as Presentation[];
		const convertedHls = cmafHam.hamToHls(presentations);
		deepEqual(convertedHls.manifest, hlsMain2);
		equal(convertedHls.type, 'hls');
		equal(convertedHls.ancillaryManifests, hlsPlaylist2);
	});

	it('converts ham3 to hls', () => {
		const presentations = ham3 as Presentation[];
		const convertedHls = cmafHam.hamToHls(presentations);
		deepEqual(convertedHls.manifest, hlsMain3);
		equal(convertedHls.type, 'hls');
		equal(convertedHls.ancillaryManifests, hlsPlaylist3);
	});
});

describe.skip('hls to ham to hls', () => {
	it('converts hls0 to ham0 to hls0 again', () => {
		const convertedHam = cmafHam.hlsToHam(hlsMain0, hlsPlaylist0);
		const convertedHls = cmafHam.hamToHls(convertedHam);
		deepEqual(convertedHls.manifest, hlsMain0);
		deepEqual(convertedHls.ancillaryManifests, hlsPlaylist0);
	});
});
