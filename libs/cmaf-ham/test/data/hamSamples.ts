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
	},
	{
		id: 'video-segment-2',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000002.cmfv',
		startTime: 10,
	},
	{
		id: 'video-segment-3',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv',
		startTime: 20,
	},
	{
		id: 'video-segment-4',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000004.cmfv',
		startTime: 30,
	},
	{
		id: 'video-segment-5',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv',
		startTime: 40,
	},
]

export const audioSegments: Segment[] = [
	{
		id: 'audio-segment-1',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000001.cmfa',
		startTime: 0,
	},
	{
		id: 'audio-segment-2',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000002.cmfa',
		startTime: 18.75,
	},
	{
		id: 'audio-segment-3',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000003.cmfa',
		startTime: 37.5,
	},
	{
		id: 'audio-segment-4',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000004.cmfa',
		startTime: 56.25,
	},
	{
		id: 'audio-segment-5',
		duration: 18.75,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000005.cmfa',
		startTime: 75,
	},
]

export const invalidSegments: Segment[] = [
	{
		id: 'invalid-segment-1',
		duration: parseInt(''),
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv',
		startTime: 0,
	},
	{
		id: 'invalid-segment-2',
		duration: 0,
		url: '',
		startTime: 0,
	},
	{
		id: 'invalid-segment-3',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv',
		startTime: 0,
	},
	{
		id: 'invalid-segment-4',
		duration: 10,
		url: '',
		startTime: 10,
	},
	{
		id: 'invalid-segment-5',
		duration: 10,
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv',
		startTime: 20,
	},
]

export const videoTrack: VideoTrack = {
	url: 'video/mp4',
	bandwidth: 2000000,
	codecs: ['avc1.640028'],
	mimeType: 'video/mp4',
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
	initialization: {
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-videoinit.cmfv',
	},
	baseUrls: [],
} as VideoTrack


// @ts-expect-error - Invalid video track
export const invalidVideoTrack: VideoTrack = {
	url: 'video/mp4',
	bandwidth: 2000000,
	codecs: ['avc1.640028'],
	mimeType: 'video/mp4',
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
	initialization: {
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-videoinit.cmfv',
	},
	baseUrls: [],
} as VideoTrack

export const audioTrack: AudioTrack = {
	url: 'audio/mp4',
	bandwidth: 96000,
	channels: 2,
	codecs: ['mp4a.40.2'],
	mimeType: 'audio/mp4',
	duration: 93.75,
	id: '1',
	language: 'en',
	sampleRate: 48000,
	segments: audioSegments,
	type: 'audio',
	initialization: {
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audioinit.cmfa',
	},
	baseUrls: [],
} as AudioTrack

export const invalidAudioTrack: AudioTrack = {
	url: 'audio/mp4',
	bandwidth: 96000,
	channels: 2,
	codecs: [],
	mimeType: 'audio/mp4',
	duration: 93.75,
	id: '1',
	language: 'en',
	sampleRate: 48000,
	segments: audioSegments,
	type: 'audio',
	initialization: {
		url: 'https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audioinit.cmfa',
	},
	baseUrls: [],
} as AudioTrack

export const presentation: Presentation = {
	id: '1',
	duration: 50,
	startTime: 0,
	endTime: 50,
	baseUrls: [],
	selectionSets: [
		{
			id: 'video',
			type: 'video',
			switchingSets: [
				{
					id: 'video',
					tracks: [videoTrack],
					baseUrls: [],
				},
			],
		},
		{
			id: 'audio',
			type: 'audio',
			switchingSets: [
				{
					id: 'audio',
					tracks: [audioTrack],
					baseUrls: [],
				},
			],
		},
	],
}

export const invalidPresentation: Presentation = {
	id: '',
	duration: 50,
	startTime: 0,
	endTime: 50,
	baseUrls: [],
	selectionSets: [
		{
			id: 'video',
			type: 'video',
			switchingSets: [
				{
					id: 'video',
					tracks: [invalidVideoTrack, videoTrack],
					baseUrls: [],
				},
			],
		},
		{
			id: 'audio',
			type: 'audio',
			switchingSets: [
				{
					id: 'video',
					tracks: [audioTrack, invalidAudioTrack],
					baseUrls: [],
				},
			],
		},
	],
}
