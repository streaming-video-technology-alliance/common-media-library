import { DashManifest } from '../../utils/dash/DashManifest.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { mpdToHam } from '../../utils/dash/mpdToHam.js';
import { xmlToJson, jsonToXml } from '../../utils/xmlUtils.js';
import { hamToMPD } from '../../utils/dash/hamToMPD.js';

export class MPDMapper implements IMapper {
	//TODO : Handle SegmentTemplate and SegmentList

	toHam(manifest: Manifest): Presentation[] {
		let dashManifest: DashManifest | undefined;
		xmlToJson(
			manifest.manifest,
			(result: DashManifest) => (dashManifest = result),
		);

		if (!dashManifest) {
			return [];
		}

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
