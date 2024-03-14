import {
	calculateDuration,
	getChannels,
	getCodec,
	getContentType,
	getFrameRate,
	getGroup,
	getLanguage,
	getName,
	// getNumberOfSegments,
	getPresentationId,
	// getSampleRate,
	// getSar,
	// getTrackDuration,
	// getUrlFromTemplate,
} from '../ham/mapper/mpd/utilsMpdToHam.js';
import { describe, it } from 'node:test';
import { equal } from 'node:assert';
import {
	AdaptationSet,
	Period,
	Representation,
	// SegmentTemplate,
} from '../ham/types';

describe('calculateDuration', () => {
	it('returns 1 when duration is 1 and timescale is 1', () => {
		const res = calculateDuration('1', '1');
		equal(res, 1);
	});

	it('returns 1 when duration and timescale are undefined', () => {
		const res = calculateDuration(undefined, undefined);
		equal(res, 1);
	});

	it('returns 10 when duration is 900000 and timescale is 90000', () => {
		const res = calculateDuration('900000', '90000');
		equal(res, 10);
	});
});

describe('getChannels', () => {
	it('returns 2 when AdaptationSet has value 2 and representation has value 3', () => {
		const res = getChannels(
			{
				AudioChannelConfiguration: [
					{
						$: {
							schemeIdUri:
								'urn:mpeg:dash:23003:3:audio_channel_configuration:2011',
							value: '2',
						},
					},
				],
			} as AdaptationSet,
			{
				$: { id: 'representationId' },
				AudioChannelConfiguration: [
					{
						$: {
							schemeIdUri:
								'urn:mpeg:dash:23003:3:audio_channel_configuration:2011',
							value: '3',
						},
					},
				],
			} as Representation,
		);
		equal(res, 2);
	});

	it('returns 3 when Representation has value 3 and AdaptationSet has no value', () => {
		const res = getChannels(
			{} as AdaptationSet,
			{
				$: { id: 'representationId' },
				AudioChannelConfiguration: [
					{
						$: {
							schemeIdUri:
								'urn:mpeg:dash:23003:3:audio_channel_configuration:2011',
							value: '3',
						},
					},
				],
			} as Representation,
		);
		equal(res, 3);
	});

	it('returns 0 when Representation and AdaptationSet have no value', () => {
		const res = getChannels(
			{} as AdaptationSet,
			{ $: { id: 'representationId' } } as Representation,
		);
		equal(res, 0);
	});
});

describe('getCodec', () => {
	it('returns representationCodecs if both adaptationSet and Representation have codecs', () => {
		const res = getCodec(
			{
				$: {
					codecs: 'adaptationCodecs',
				},
			} as AdaptationSet,
			{
				$: {
					codecs: 'representationCodecs',
				},
			} as Representation,
		);
		equal(res, 'representationCodecs');
	});

	it('returns adaptationCodecs if Representation has no codecs', () => {
		const res = getCodec(
			{
				$: {
					codecs: 'adaptationCodecs',
				},
			} as AdaptationSet,
			{ $: {} } as Representation,
		);
		equal(res, 'adaptationCodecs');
	});

	it('returns empty string if Representation and AdaptationSet have no codecs', () => {
		const res = getCodec(
			{ $: {} } as AdaptationSet,
			{ $: {} } as Representation,
		);
		equal(res, '');
	});
});

describe('getContentType', () => {
	it('returns contentType from AdaptationSet if it exists', () => {
		const res = getContentType(
			{
				$: {
					contentType: 'audio',
					mimeType: 'video/mp4',
					maxHeight: '1000',
				},
				ContentComponent: [{ $: { contentType: 'video' } }],
			} as AdaptationSet,
			{ $: { mimeType: 'video/mp4' } } as Representation,
		);
		equal(res, 'audio');
	});

	it('returns contentType from ContentComponent if it exists and adaptationSet has no contentType', () => {
		const res = getContentType(
			{
				$: {
					mimeType: 'video/mp4',
					maxHeight: '1000',
				},
				ContentComponent: [{ $: { contentType: 'audio' } }],
			} as AdaptationSet,
			{ $: { mimeType: 'video/mp4' } } as Representation,
		);
		equal(res, 'audio');
	});

	it('returns mimeType from AdaptationSet if there is no contentType', () => {
		const res = getContentType(
			{
				$: {
					mimeType: 'audio/mp4',
					maxHeight: '1000',
				},
			} as AdaptationSet,
			{ $: { mimeType: 'video/mp4' } } as Representation,
		);
		equal(res, 'audio');
	});

	it('returns mimeType from Representation if there is no contentType and mimeType on AdaptationSet', () => {
		const res = getContentType(
			{
				$: {
					maxHeight: '1000',
				},
			} as AdaptationSet,
			{ $: { mimeType: 'audio/mp4' } } as Representation,
		);
		equal(res, 'audio');
	});

	it('does not return mimeType from Representation if it is different from audio, video or text', () => {
		const res = getContentType(
			{
				$: {
					maxHeight: '1000',
				},
			} as AdaptationSet,
			{ $: { mimeType: 'test/mp4' } } as Representation,
		);
		equal(res, 'video');
	});

	it('returns video if it has maxHeight and the type could not be found with another method', () => {
		const res = getContentType(
			{
				$: {
					maxHeight: '1000',
				},
			} as AdaptationSet,
			{ $: {} } as Representation,
		);
		equal(res, 'video');
	});

	it('returns text as default if there is no type', () => {
		const res = getContentType(
			{
				$: {},
			} as AdaptationSet,
			{ $: {} } as Representation,
		);
		equal(res, 'text');
	});
});

describe('getFrameRate', () => {
	it('returns frameRate from representation if it exists', () => {
		const res = getFrameRate(
			{ $: { frameRate: '24' } } as AdaptationSet,
			{ $: { frameRate: '30' } } as Representation,
		);
		equal(res, '30');
	});

	it('returns frameRate from adaptationSet if it exists and representation does not have frameRate', () => {
		const res = getFrameRate(
			{ $: { frameRate: '24' } } as AdaptationSet,
			{ $: {} } as Representation,
		);
		equal(res, '24');
	});

	it('returns empty string if there is no frameRate', () => {
		const res = getFrameRate(
			{ $: {} } as AdaptationSet,
			{ $: {} } as Representation,
		);
		equal(res, '');
	});
});

describe('getGroup', () => {
	it('returns group from adaptationSet if it exists', () => {
		const res = getGroup({
			$: { group: 'adaptationGroup' },
		} as AdaptationSet);
		equal(res, 'adaptationGroup');
	});

	it('returns contentType as group if adaptationSet hs no group', () => {
		const res = getGroup({
			$: { contentType: 'audio' },
		} as AdaptationSet);
		equal(res, 'audio');
	});
});

describe('getLanguage', () => {
	it('returns lang from adaptationSet if it exists', () => {
		const res = getLanguage({ $: { lang: 'es' } } as AdaptationSet);
		equal(res, 'es');
	});

	it('returns und as language if lang does not exist', () => {
		const res = getLanguage({ $: {} } as AdaptationSet);
		equal(res, 'und');
	});
});

describe('getName', () => {
	it('returns mimeType from adaptationSet if it exists', () => {
		const res = getName(
			{ $: { mimeType: 'audio' } } as AdaptationSet,
			{ $: {} } as Representation,
			'video',
		);
		equal(res, 'audio');
	});

	it('returns mimeType from representation if it exists and adaptationSet has no mimeType', () => {
		const res = getName(
			{ $: {} } as AdaptationSet,
			{ $: { mimeType: 'audio' } } as Representation,
			'video',
		);
		equal(res, 'audio');
	});

	it('returns type if adaptationSet and representation have no mimeType', () => {
		const res = getName(
			{ $: {} } as AdaptationSet,
			{ $: {} } as Representation,
			'video',
		);
		equal(res, 'video');
	});
});

// describe('getNumberOfSegments', () => {
// 	it('getNumberOfSegments', () => {
// 		const res = getNumberOfSegments({} as SegmentTemplate, 0);
// 		equal(res, 5);
// 	});
// });
//
describe('getPresentationId', () => {
	it('returns period id if it exists', () => {
		const res = getPresentationId({ $: { id: 'periodId' } } as Period, 5);
		equal(res, 'periodId');
	});

	it('returns presentation-id-duration if period id does not exist', () => {
		const res = getPresentationId({ $: {} } as Period, 5);
		equal(res, 'presentation-id-5');
	});
});

// describe('getSampleRate', () => {
// 	it('getSampleRate', () => {
// 		const res = getSampleRate({} as AdaptationSet, {} as Representation);
// 		equal(res, 5);
// 	});
// });
//
// describe('getSar', () => {
// 	it('getSar', () => {
// 		const res = getSar({} as AdaptationSet, {} as Representation);
// 		equal(res, 5);
// 	});
// });
//
// describe('getTrackDuration', () => {
// 	it('getTrackDuration', () => {
// 		const res = getTrackDuration([]);
// 		equal(res, 5);
// 	});
// });
//
// describe('getUrlFromTemplate', () => {
// 	it('getUrlFromTemplate', () => {
// 		const res = getUrlFromTemplate(
// 			{} as Representation,
// 			{} as SegmentTemplate,
// 			0,
// 		);
// 		equal(res, 5);
// 	});
// });
