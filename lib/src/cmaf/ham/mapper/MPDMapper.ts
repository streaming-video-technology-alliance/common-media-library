import { MPDManifest } from '../types/DashManifest.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { mpdToHam } from './mpd/mpdToHam.js';
import { jsonToXml, xmlToJson } from '../../utils/xmlUtils.js';
import { mapHamToMpd } from './mpd/mapHamToMpd.js';
import { addMetadataToDASH, getMetadata } from '../../utils/manifestUtils.js';

export class MPDMapper implements IMapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): JSON | undefined {
		return getMetadata(this.manifest);
	}

	toHam(manifest: Manifest): Presentation[] {
		const dashManifest: MPDManifest | undefined = xmlToJson(
			manifest.manifest,
		);

		if (!dashManifest) {
			return [];
		}
		addMetadataToDASH(dashManifest, manifest);

		return mpdToHam(dashManifest);
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
