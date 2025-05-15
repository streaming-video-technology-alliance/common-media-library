
import type { SelectionSet } from '../../../types/model/SelectionSet.js';

import type { AdaptationSet } from '../../../types/mapper/dash/AdaptationSet.js';

import { tracksToRepresentation } from './tracksToRepresentation.js';

import { getFrameRate } from './utils/getFrameRate.js';

export function selectionSetsToAdaptationSet(
	selectionsSets: SelectionSet[],
): AdaptationSet[] {
	return selectionsSets.flatMap((selectionSet) => {
		return selectionSet.switchingSets.map((switchingSet) => {
			const track = switchingSet.tracks[0];
			return {
				$: {
					id: switchingSet.id,
					group: selectionSet.id,
					contentType: track?.type,
					mimeType: `${track?.type}/mp4`,
					frameRate: getFrameRate(track),
					lang: track?.language,
					codecs: track?.codec,
				},
				Representation: tracksToRepresentation(switchingSet.tracks),
			} as AdaptationSet;
		});
	});
}
