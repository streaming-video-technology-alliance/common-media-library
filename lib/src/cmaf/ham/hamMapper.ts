import { AdaptationSet, DashManifest, Representation } from '../utils/dash/DashManifest.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { Track } from './Track.js';
import { SwitchingSet } from './SwitchingSet.js';
import { Segment } from './Segment.js';
import { VideoTrack } from './VideoTrack.js';
import { AudioTrack } from './AudioTrack.js';
import { TextTrack } from './TextTrack.js';

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
			representation.$.bandwidth,
			segments,
			adaptationSet.$.maxWidth ?? 0, // TODO: handle undefined values
			adaptationSet.$.maxHeight ?? 0,
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
			representation.$.bandwidth,
			segments,
			adaptationSet.$.audioSamplingRate ?? 0,
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
			representation.$.bandwidth,
			segments,
		);
	}
}

export function mapMpdToHam(rawManifest: DashManifest): Presentation {
	const presentation: Presentation[] = rawManifest.MPD.Period.map((period) => {
		const duration = +period.$.duration;
		const url = 'url'; // todo: get real url

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

			selectionSetGroups[adaptationSet.$.group].switchingSet.push(
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

		return new Presentation('id', duration, selectionSet);
	});

	return presentation[0];
}