import type { Presentation } from '../../../types/model/Presentation';

import type { DashManifest } from '../../../types/mapper/dash/DashManifest';
import type { Period } from '../../../types/mapper/dash/Period';

import { presentationsToPeriods } from './presentationsToPeriods.ts';

import { serializeDashManifest } from '../../../utils/dash/serializeDashManifest.ts';

export function mapHamToDash(hamManifests: Presentation[]): string {
	const periods: Period[] = presentationsToPeriods(hamManifests);
	const duration: string = periods[0].$.duration;
	const manifest: DashManifest = {
		MPD: {
			$: {
				mediaPresentationDuration: duration,
				type: 'static',
			},
			Period: periods,
		},
	};

	return serializeDashManifest(manifest);
}
