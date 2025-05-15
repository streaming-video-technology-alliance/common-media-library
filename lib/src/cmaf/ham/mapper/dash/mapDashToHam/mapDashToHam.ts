import type { AdaptationSet } from '../../../types/mapper/dash/AdaptationSet.js';
import type { DashManifest } from '../../../types/mapper/dash/DashManifest.js';
import type { Period } from '../../../types/mapper/dash/Period.js';
import type { Representation } from '../../../types/mapper/dash/Representation.js';

import type { Presentation } from '../../../types/model/Presentation.js';
import type { Segment } from '../../../types/model/Segment.js';
import type { SelectionSet } from '../../../types/model/SelectionSet.js';
import type { SwitchingSet } from '../../../types/model/SwitchingSet.js';
import type { Track } from '../../../types/model/Track.js';

import { iso8601DurationToNumber } from '../../../utils/dash/iso8601DurationToNumber.js';

import { getGroup } from './utils/getGroup.js';
import { getInitializationUrl } from './utils/getInitializationUrl.js';
import { getPresentationId } from './utils/getPresentationId.js';

import { mapSegments } from './mapSegments.js';
import { mapTracks } from './mapTracks.js';

/**
 * @internal
 *
 * Main function to map dash to ham.
 *
 * @param dash - Dash manifest to map
 * @returns List of presentations in ham
 */
export function mapDashToHam(dash: DashManifest): Presentation[] {
	return dash.MPD.Period.map((period: Period) => {
		const duration: number = iso8601DurationToNumber(period.$.duration);
		const presentationId: string = getPresentationId(period, duration);

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet: AdaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map(
				(representation: Representation) => {
					const segments: Segment[] = mapSegments(
						adaptationSet,
						representation,
						duration,
					);

					return mapTracks(
						adaptationSet,
						representation,
						segments,
						getInitializationUrl(adaptationSet, representation),
					);
				},
			);

			const group: string = getGroup(adaptationSet);
			if (!selectionSetGroups[group]) {
				selectionSetGroups[group] = {
					id: group,
					switchingSets: [],
				} as SelectionSet;
			}

			selectionSetGroups[group].switchingSets.push({
				id:
					adaptationSet.$.id ??
					adaptationSet.ContentComponent?.at(0)?.$.id ??
					group,
				tracks,
			} as SwitchingSet);
		});

		const selectionSets: SelectionSet[] = Object.values(selectionSetGroups);

		return { id: presentationId, selectionSets } as Presentation;
	});
}
