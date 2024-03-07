import { mapMpdToHam } from './mpd/mapMpdToHam.js';
import { jsonToXml, xmlToJson } from '../../utils/xmlUtils.js';
import { mapHamToMpd } from './mpd/mapHamToMpd.js';
import { addMetadataToDASH, getMetadata } from '../../utils/manifestUtils.js';
import { IMapper } from './IMapper.js';
import type { DashManifest, Manifest } from '../types';
import type { Presentation } from '../types/model';

export class MPDMapper implements IMapper {
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
		addMetadataToDASH(dashManifest, manifest);

		return mapMpdToHam(dashManifest);
	}

	toManifest(presentation: Presentation[]): Manifest {
		const jsonMpd = mapHamToMpd(presentation);

		if (!jsonMpd) {
			return { manifest: '', ancillaryManifests: [], type: 'mpd' };
		}

		const mpd = jsonToXml(jsonMpd);
		return { manifest: mpd, ancillaryManifests: [], type: 'mpd' };
	}
}
