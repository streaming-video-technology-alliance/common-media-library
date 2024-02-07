import { DashManifest } from '../utils/dash/DashManifest';
import { Presentation } from './Presentation';
import { SelectionSet } from './SelectionSet';
import { Track } from './Track';
import { SwitchingSet } from './SwitchingSet';
import { Segment } from './Segment';

export function mapMpdToHam(rawManifest: DashManifest): Presentation {
	const presentation: Presentation[] = rawManifest.Period.map((period) => {
		const duration = +period.$.duration;
		const url = 'url'; // todo: get real url

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map((representation) => {
				const segments = representation.SegmentBase.map((segment) =>
					new Segment(duration, url, segment.$.indexRange),
				);

				return new Track(
					representation.$.id,
					adaptationSet.$.contentType,
					adaptationSet.$.codecs,
					duration,
					adaptationSet.$.lang,
					representation.$.bandwidth,
					segments,
				);
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
