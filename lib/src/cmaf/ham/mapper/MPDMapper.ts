import { DashManifest } from '../../utils/dash/DashManifest.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { mpdToHam } from '../../utils/dash/mpdToHam.js';
import { xmlToJson, jsonToXml } from '../../utils/xmlUtils.js';
import { hamToMPD } from '../../utils/dash/hamToMPD.js';
import { addMetadataToDASH, getMetadata } from '../../utils/manifestUtils.js';

export class MPDMapper implements IMapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): JSON | undefined {
		return getMetadata(this.manifest);
	}

	toHam(manifest: Manifest): Presentation[] {
		let dashManifest: DashManifest | undefined;
		this.manifest = manifest;
		xmlToJson(
			manifest.manifest,
			(result: DashManifest) => (dashManifest = result),
		);

		if (!dashManifest) {
			return [];
		}
		addMetadataToDASH(dashManifest, manifest);

		const presentations = mpdToHam(dashManifest);
		return presentations;
	}

	toManifest(presentation: Presentation[]): Manifest {
		const jsonMpd = hamToMPD(presentation);

		if (!jsonMpd) {
			return { manifest: '', anciallaryManifests: [], type: 'mpd' };
		}

		const mpd = jsonToXml(jsonMpd);
		return { manifest: mpd, anciallaryManifests: [], type: 'mpd' };
	}
}
