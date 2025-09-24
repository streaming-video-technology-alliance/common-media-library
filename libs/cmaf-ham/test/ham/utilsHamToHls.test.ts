import { equal } from 'node:assert';
import { describe, it } from 'node:test';

import type { AudioTrack } from '@svta/common-media-library/cmaf-ham';

import { getByterange } from '@svta/common-media-library/cmaf/ham/mapper/hls/mapHamToHls/utils/getByterange.js';
import { getPlaylistData } from '@svta/common-media-library/cmaf/ham/mapper/hls/mapHamToHls/utils/getPlaylistData.js';
import { getSegments } from '@svta/common-media-library/cmaf/ham/mapper/hls/mapHamToHls/utils/getSegments.js';
import { getUrlInitialization } from '@svta/common-media-library/cmaf/ham/mapper/hls/mapHamToHls/utils/getUrlInitialization.js';

import { getAudioTrack } from './data/hlsData.ts';

describe('getByterange', () => {
	it('returns byteRange string if track has byteRange', () => {
		const track: AudioTrack = getAudioTrack({ byteRange: '50379@2212' });
		const res = getByterange(track);
		equal(res, 'BYTERANGE:50379@2212\n');
	});

	it('returns byteRange string if segment has byteRange', () => {
		const track: AudioTrack = getAudioTrack({});
		track.segments[0].byteRange = '123@456';
		const res = getByterange(track);
		equal(res, 'BYTERANGE:0@122\n');
	});

	it('returns empty string if track and segments have no byteRange', () => {
		const res = getByterange({} as AudioTrack);
		equal(res, '');
	});
});

describe('getPlaylistData', () => {
	it('returns playlist data', () => {
		const track: AudioTrack = getAudioTrack({});
		const res = getPlaylistData(track);
		equal(
			res,
			'#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4",\n',
		);
	});
});

describe('getSegments', () => {
	it('returns segments from track segments', () => {
		const track: AudioTrack = getAudioTrack({});
		track.segments[0].byteRange = '123@456';
		const res = getSegments(track.segments);
		equal(
			res,
			'#EXTINF:4.011,\n' +
			'#EXT-X-BYTERANGE:123@456\n' +
			'\n' +
			'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s1.mp4\n' +
			'#EXTINF:3.989,\n' +
			'\n' +
			'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s2.mp4',
		);
	});
});

describe('getUrlInitialization', () => {
	it('returns url initialization', () => {
		const track: AudioTrack = getAudioTrack({});
		const res = getUrlInitialization(track);
		equal(
			res,
			'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4',
		);
	});

	it('returns empty string if track has no urlInitialization', () => {
		const res = getUrlInitialization({} as AudioTrack);
		equal(res, '');
	});
});
