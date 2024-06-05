import type { Presentation } from '../../../types/model/Presentation.js';

import type { DashManifest } from '../../../types/mapper/dash/DashManifest.js';
import type { Period } from '../../../types/mapper/dash/Period.js';

import { presentationsToPeriods } from './presentationsToPeriods.js';

import { jsonToXml } from '../../../utils/dash/jsonToXml.js';

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

	return jsonToXml(manifest);
}
