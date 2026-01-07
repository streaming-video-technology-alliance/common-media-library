import type { AudioTrack, SegmentHls } from '@svta/cml-cmaf-ham'

export type AudioTrackInfo = {
	byteRange?: { start: number; end: number };
	codec?: string;
	duration?: number;
	id?: string;
	language?: string;
	urlInitialization?: string;
};

function getAudioTrack({
	byteRange,
	codec = 'mp4a.40.2',
	duration = 5,
	id = 'default-audio-group',
	language = 'en',
	urlInitialization = 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4',
}: AudioTrackInfo): AudioTrack {
	return {
		id: id,
		url: '',
		type: 'audio',
		codecs: codec ? [codec] : [],
		mimeType: 'audio/mp4',
		duration: duration,
		language: language,
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
		initialization: {
			url: urlInitialization,
			...(byteRange && { byteRange }),
		},
		baseUrls: [],
	} as AudioTrack
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
	]
}

export { getAudioTrack, getSegments }
