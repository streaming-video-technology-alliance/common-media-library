import { AudioTrack } from '../ham/types/model';
import { Representation, SegmentTemplate } from '../ham/types';

const representationBase: Representation = {
	$: {
		id: 'audio_eng=64349',
		bandwidth: '64349',
	},
	BaseURL: ['tears-of-steel-aac-64k.cmfa'],
	SegmentBase: [
		{
			$: {
				timescale: '48000',
				indexRangeExact: 'true',
				indexRange: '704-2211',
			},
			Initialization: [
				{
					$: {
						range: '0-703',
					},
				},
			],
		},
	],
};

const representationList: Representation = {
	$: {
		bandwidth: '72000',
		codecs: 'avc1.42c01e',
		frameRate: '37',
		height: '480',
		id: 'testStream01bbbVideo72000',
		mimeType: 'video/mp4',
		sar: '1:1',
		width: '854',
	},
	SegmentList: [
		{
			$: {
				duration: '10000',
				timescale: '1000',
			},
			Initialization: [
				{
					$: {
						sourceURL: 'testStream01bbb/video/72000/seg_init.mp4',
					},
				},
			],
			SegmentURL: [
				{
					$: {
						media: 'testStream01bbb/video/72000/segment_0.m4s',
					},
				},
				{
					$: {
						media: 'testStream01bbb/video/72000/segment_10417.m4s',
					},
				},
				{
					$: {
						media: 'testStream01bbb/video/72000/segment_20833.m4s',
					},
				},
			],
		},
	],
};

const representationTemplate: Representation = {
	$: {
		id: '1',
		mimeType: 'video/mp4',
		codecs: 'avc1.64001f',
		width: '512',
		height: '288',
		frameRate: '24',
		sar: '1:1',
		startWithSAP: '1',
		bandwidth: '386437',
	},
};

const segmentTemplate: SegmentTemplate = {
	$: {
		timescale: '24',
		media: '$RepresentationID$/$Number%04d$.m4s',
		startNumber: '1',
		duration: '96',
		initialization: '$RepresentationID$/init.mp4',
	},
};

const duration = 13;

const audioTrack1: AudioTrack = {
	id: 'default-audio-group',
	type: 'AUDIO',
	codec: '',
	duration: 5,
	language: 'en',
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
	urlInitialization:
		'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4',
};

const videoTrack1 = {};

export {
	representationBase,
	representationList,
	representationTemplate,
	duration,
	segmentTemplate,
	audioTrack1,
	videoTrack1,
};
