import { mapDashToHam } from './dash/mapDashToHam.js';
import { jsonToXml, xmlToJson } from '../../utils/xmlUtils.js';
import { mapHamToDash } from './dash/mapHamToDash.js';
import { addMetadataToDash, getMetadata } from '../../utils/manifestUtils.js';
import { IMapper } from './IMapper.js';
import type { DashManifest, Manifest } from '../types';
import type { Presentation } from '../types/model';

export class DashMapper implements IMapper {
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
		const jsonMpd = mapHamToDash(presentation);

		if (!jsonMpd) {
			return { manifest: '', ancillaryManifests: [], type: 'dash' };
		}

		const mpd = jsonToXml(jsonMpd);
		return { manifest: mpd, ancillaryManifests: [], type: 'dash' };
	}
}
