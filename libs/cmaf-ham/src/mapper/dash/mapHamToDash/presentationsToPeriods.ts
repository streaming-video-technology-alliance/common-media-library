import type { Period } from '../../../types/mapper/dash/Period.ts'
import type { Presentation } from '../../../types/model/Presentation.ts'

import { encodeIso8601Duration } from '@svta/cml-iso-8601'

import { selectionSetsToAdaptationSet } from './selectionSetsToAdaptationSet.ts'

export function presentationsToPeriods(presentations: Presentation[]): Period[] {
	return presentations.map((presentation: Presentation) => {
		return {
			$: {
				duration: encodeIso8601Duration(
					presentation.selectionSets[0].switchingSets[0].tracks[0].duration,
				),
				id: presentation.id,
				start: 'PT0S',
			},
			AdaptationSet: selectionSetsToAdaptationSet(presentation.selectionSets),
		}
	})
}
