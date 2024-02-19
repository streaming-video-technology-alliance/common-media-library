import { AdaptationSet, DashManifest, Representation } from '../utils/dash/DashManifest.js';
import {
	Presentation,
	SelectionSet,
	SwitchingSet,
	Segment,
	Track,
	VideoTrack,
	AudioTrack,
	TextTrack,
} from './model/index.js';
import { iso8601DurationToNumber } from '../utils/utils.js';

function createTrack(
	type: string,
	representation: Representation,
	adaptationSet: AdaptationSet,
	duration: number,
	segments: Segment[],
): AudioTrack | VideoTrack | TextTrack {
	if (type === 'video') {
		return new VideoTrack(
			representation.$.id,
			adaptationSet.$.contentType,
			adaptationSet.$.codecs,
			duration,
			adaptationSet.$.lang,
			+representation.$.bandwidth,
			segments,
			+(adaptationSet.$.maxWidth ?? 0),
			+(adaptationSet.$.maxHeight ?? 0),
			0, // TODO: add frameRate and scanType
			adaptationSet.$.par ?? '',
			adaptationSet.$.sar ?? '',
			'',
		);
	}
	else if (type === 'audio') {
		return new AudioTrack(
			representation.$.id,
			adaptationSet.$.contentType,
			adaptationSet.$.codecs,
			duration,
			adaptationSet.$.lang,
			+representation.$.bandwidth,
			segments,
			+(adaptationSet.$.audioSamplingRate ?? 0),
			0, // TODO: add channels
		);
	}
	else { // if (type === 'text')
		return new TextTrack(
			representation.$.id,
			adaptationSet.$.contentType,
			adaptationSet.$.codecs,
			duration,
			adaptationSet.$.lang,
			+representation.$.bandwidth,
			segments,
		);
	}
}

export function mapMpdToHam(rawManifest: DashManifest): Presentation {
	const presentation: Presentation[] = rawManifest.MPD.Period.map((period) => {
		const duration: number = iso8601DurationToNumber(period.$.duration);
		const url: string = 'url'; // todo: get real url
		const presentationId: string = 'presentation-id'; // todo: handle id

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map((representation) => {
				const segments = representation.SegmentBase.map((segment) =>
					new Segment(duration, url, segment.$.indexRange),
				);

				return createTrack(adaptationSet.$.contentType, representation, adaptationSet, duration, segments);
			});

			if (!selectionSetGroups[adaptationSet.$.group]) {
				selectionSetGroups[adaptationSet.$.group] = new SelectionSet(
					adaptationSet.$.group,
					duration,
					[],
				);
			}

			selectionSetGroups[adaptationSet.$.group].switchingSets.push(
				new SwitchingSet(
					adaptationSet.$.id,
					adaptationSet.$.contentType,
					adaptationSet.$.codecs,
					duration,
					adaptationSet.$.lang,
					tracks,
				),
			);
		});

		const selectionSet: SelectionSet[] = Object.values(selectionSetGroups);

		return new Presentation(presentationId, duration, selectionSet);
	});

	return presentation[0];
}
