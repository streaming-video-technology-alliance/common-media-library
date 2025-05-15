
import type { Period } from '../../../types/mapper/dash/Period.js';
import type { Presentation } from '../../../types/model/Presentation.js';

import { selectionSetsToAdaptationSet } from './selectionSetsToAdaptationSet.js';

import { numberToIso8601Duration } from '../../../utils/dash/numberToIso8601Duration.js';

export function presentationsToPeriods(presentations: Presentation[]): Period[] {
	return presentations.map((presentation: Presentation) => {
		return {
			$: {
				duration: numberToIso8601Duration(
					presentation.selectionSets[0].switchingSets[0].tracks[0]
						.duration,
				),
				id: presentation.id,
				start: 'PT0S',
			},
			AdaptationSet: selectionSetsToAdaptationSet(
				presentation.selectionSets,
			),
		} as Period;
	});
}
