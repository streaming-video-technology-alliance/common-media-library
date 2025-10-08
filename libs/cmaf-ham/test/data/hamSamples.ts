import type {
	AudioTrack,
	Presentation,
	Segment,
	VideoTrack,
} from '@svta/common-media-library/cmaf-ham';

export const videoSegments: Segment[] = [
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv',
	},
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000002.cmfv',
	},
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv',
	},
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000004.cmfv',
	},
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv',
	},
];

export const audioSegments: Segment[] = [
	{
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000001.cmfa',
	},
	{
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000002.cmfa',
	},
	{
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000003.cmfa',
	},
	{
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000004.cmfa',
	},
	{
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000005.cmfa',
	},
];

export const invalidSegments: Segment[] = [
	{
		duration: parseInt(''),
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv',
	},
	{
		duration: 0,
		url: '',
	},
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv',
	},
	{
		duration: 10,
		url: '',
	},
	{
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv',
	},
];

export const videoTrack: VideoTrack = {
	fileName: 'video/mp4',
	bandwidth: 2000000,
	codec: 'avc1.640028',
	duration: 50,
	frameRate: {
		frameRateNumerator: 25,
		frameRateDenominator: 1,
	},
	height: 1080,
	id: '1',
	language: 'en',
	par: '',
	sar: '',
	scanType: '',
	segments: videoSegments,
	type: 'video',
	width: 1920,
	urlInitialization:
		'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-videoinit.cmfv',
} as VideoTrack;

export const invalidVideoTrack: VideoTrack = {
	fileName: 'video/mp4',
	bandwidth: 2000000,
	codec: 'avc1.640028',
	duration: 90000,
	frameRate: {
		frameRateNumerator: 25,
		frameRateDenominator: 1,
	},
	height: 1080,
	id: '',
	language: 'und',
	par: '',
	sar: '',
	scanType: '',
	segments: [
		{
			duration: 10,
			url: '',
		},
		{
			duration: 10,
			url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000002.cmfv',
		},
	],
	type: 'video',
	width: 1920,
	urlInitialization:
		'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-videoinit.cmfv',
} as VideoTrack;

export const audioTrack: AudioTrack = {
	name: 'audio/mp4',
	bandwidth: 96000,
	channels: 2,
	codec: 'mp4a.40.2',
	duration: 93.75,
	id: '1',
	language: 'en',
	sampleRate: 48000,
	segments: audioSegments,
	type: 'audio',
	urlInitialization:
		'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audioinit.cmfa',
} as AudioTrack;

export const invalidAudioTrack: AudioTrack = {
	name: 'audio/mp4',
	bandwidth: 96000,
	channels: 2,
	codec: '',
	duration: 93.75,
	id: '1',
	language: 'en',
	sampleRate: 48000,
	segments: audioSegments,
	type: 'audio',
	urlInitialization:
		'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audioinit.cmfa',
} as AudioTrack;

export const presentation: Presentation = {
	id: '1',
	selectionSets: [
		{
			id: 'video',
			switchingSets: [
				{
					id: 'video',
					tracks: [videoTrack],
				},
			],
		},
		{
			id: 'audio',
			switchingSets: [
				{
					id: 'audio',
					tracks: [audioTrack],
				},
			],
		},
	],
};

export const invalidPresentation: Presentation = {
	id: '',
	selectionSets: [
		{
			id: 'video',
			switchingSets: [
				{
					id: 'video',
					tracks: [invalidVideoTrack, videoTrack],
				},
			],
		},
		{
			id: 'audio',
			switchingSets: [
				{
					id: 'video',
					tracks: [audioTrack, invalidAudioTrack],
				},
			],
		},
	],
};
