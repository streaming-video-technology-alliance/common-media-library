import type {
	AudioTrack,
	Presentation,
	Segment,
	VideoTrack,
} from '@svta/cml-cmaf-ham'

export const videoSegments: Segment[] = [
	{
		id: 'video-segment-1',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv',
		startTime: 0,
		parent: null as any,
	},
	{
		id: 'video-segment-2',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000002.cmfv',
		startTime: 10,
		parent: null as any,
	},
	{
		id: 'video-segment-3',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv',
		startTime: 20,
		parent: null as any,
	},
	{
		id: 'video-segment-4',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000004.cmfv',
		startTime: 30,
		parent: null as any,
	},
	{
		id: 'video-segment-5',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv',
		startTime: 40,
		parent: null as any,
	},
]

export const audioSegments: Segment[] = [
	{
		id: 'audio-segment-1',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000001.cmfa',
		startTime: 0,
		parent: null as any,
	},
	{
		id: 'audio-segment-2',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000002.cmfa',
		startTime: 18.75,
		parent: null as any,
	},
	{
		id: 'audio-segment-3',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000003.cmfa',
		startTime: 37.5,
		parent: null as any,
	},
	{
		id: 'audio-segment-4',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000004.cmfa',
		startTime: 56.25,
		parent: null as any,
	},
	{
		id: 'audio-segment-5',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000005.cmfa',
		startTime: 75,
		parent: null as any,
	},
]

export const invalidSegments: Segment[] = [
	{
		id: 'invalid-segment-1',
		duration: parseInt(''),
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv',
		startTime: 0,
		parent: null as any,
	},
	{
		id: 'invalid-segment-2',
		duration: 0,
		url: '',
		startTime: 0,
		parent: null as any,
	},
	{
		id: 'invalid-segment-3',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv',
		startTime: 0,
		parent: null as any,
	},
	{
		id: 'invalid-segment-4',
		duration: 10,
		url: '',
		startTime: 10,
		parent: null as any,
	},
	{
		id: 'invalid-segment-5',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv',
		startTime: 20,
		parent: null as any,
	},
]

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
} as VideoTrack

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
} as VideoTrack

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
} as AudioTrack

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
} as AudioTrack

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
}

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
}
