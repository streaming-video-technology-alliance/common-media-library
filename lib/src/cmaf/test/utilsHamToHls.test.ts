import { describe, it } from 'node:test';
import { equal } from 'node:assert';
import {
	getByterange,
	getPlaylistData,
	getSegments,
	getUrlInitialization,
} from '../ham/mapper/hls/utilsHamToHls.js';
import { audioTrack1 } from './testData.js';
import { AudioTrack } from '../ham/types/model';

describe('getByterange', () => {
	it('returns byteRange string if track has byteRange', () => {
		const track: AudioTrack = { ...audioTrack1, byteRange: '50379@2212' };
		const res = getByterange(track);
		equal(res, 'BYTERANGE:50379@2212\n');
	});

	it('returns byteRange string if segment has byteRange', () => {
		const track: AudioTrack = { ...audioTrack1 };
		track.segments[0].byteRange = '123@456';
		const res = getByterange(track);
		equal(res, 'BYTERANGE:123@456\n');
	});

	it('returns empty string if track and segments have no byteRange', () => {
		const res = getByterange(audioTrack1);
		equal(res, '');
	});
});

describe('getPlaylistData', () => {
	it('returns playlist data', () => {
		const res = getPlaylistData(audioTrack1);
		equal(
			res,
			'#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4",BYTERANGE:0@122\n',
		);
	});
});

describe('getSegments', () => {
	it('returns segments from track segments', () => {
		const res = getSegments(audioTrack1.segments);
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
		const res = getUrlInitialization(audioTrack1);
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
