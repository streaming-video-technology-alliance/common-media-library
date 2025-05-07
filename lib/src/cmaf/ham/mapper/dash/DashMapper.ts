import type { Manifest } from '../../types/manifest/Manifest.ts';
import type { DashManifest } from '../../types/mapper/dash/DashManifest.ts';
import type { Presentation } from '../../types/model/Presentation.ts';

import { mapDashToHam } from './mapDashToHam/mapDashToHam.ts';
import { mapHamToDash } from './mapHamToDash/mapHamToDash.ts';

import { parseDashManifest } from '../../utils/dash/parseDashManifest.ts';
import { addMetadataToDash } from '../../utils/manifest/addMetadataToDash.ts';
import { getMetadata } from '../../utils/manifest/getMetadata.ts';

import type { Mapper } from '../Mapper.ts';

export class DashMapper implements Mapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): JSON | undefined {
		return getMetadata(this.manifest);
	}

	toHam(manifest: Manifest): Presentation[] {
		const dashManifest: DashManifest | undefined = parseDashManifest(
			manifest.manifest,
		);

		if (!dashManifest) {
			return [];
		}
		addMetadataToDash(dashManifest, manifest);

		return mapDashToHam(dashManifest);
	}

	toManifest(presentation: Presentation[]): Manifest {
		const manifest = mapHamToDash(presentation);
		return { manifest, ancillaryManifests: [], type: 'dash' };
	}
}
