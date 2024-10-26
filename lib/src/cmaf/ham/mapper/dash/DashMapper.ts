import type { Manifest } from '../../types/manifest/Manifest.js';
import type { DashManifest } from '../../types/mapper/dash/DashManifest.js';
import type { Presentation } from '../../types/model/Presentation.js';

import { mapDashToHam } from './mapDashToHam/mapDashToHam.js';
import { mapHamToDash } from './mapHamToDash/mapHamToDash.js';

import { xmlToJson } from '../../utils/dash/xmlToJson.js';
import { addMetadataToDash } from '../../utils/manifest/addMetadataToDash.js';
import { getMetadata } from '../../utils/manifest/getMetadata.js';

import type { Mapper } from '../Mapper.js';

export class DashMapper implements Mapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): JSON | undefined {
		return getMetadata(this.manifest);
	}

	toHam(manifest: Manifest): Presentation[] {
		const dashManifest: DashManifest | undefined = xmlToJson(
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
