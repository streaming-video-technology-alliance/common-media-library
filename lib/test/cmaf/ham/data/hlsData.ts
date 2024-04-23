import { AudioTrack } from '../../../../src/cmaf/ham/types/model/index.js';
import { SegmentHls } from '../../../../src/cmaf/ham/types/index.js';

function getAudioTrack({
	byteRange = '',
	codec = '',
	duration = 5,
	id = 'default-audio-group',
	language = 'en',
	urlInitialization = 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4',
}): AudioTrack {
	return {
		id: id,
		type: 'audio',
		codec: codec,
		duration: duration,
		language: language,
		byteRange: byteRange,
		bandwidth: 0,
		segments: [
			{
				duration: 4.011,
				url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s1.mp4',
			},
			{
				duration: 3.989,
				url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s2.mp4',
			},
		],
		sampleRate: 0,
		channels: 0,
		urlInitialization: urlInitialization,
	} as AudioTrack;
}

function getSegments(): SegmentHls[] {
	return [
		{
			duration: 4.011,
			uri: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s1.mp4',
			byterange: { length: 12, offset: 34 },
		},
		{
			duration: 3.989,
			uri: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s2.mp4',
			byterange: { length: 56, offset: 78 },
		},
	];
}

export { getAudioTrack, getSegments };
