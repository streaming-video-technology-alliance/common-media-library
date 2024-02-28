import { MPDManifest } from '../types/DashManifest.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { mapMpdToHam } from './mpd/mapMpdToHam.js';
import { jsonToXml, xmlToJson } from '../../utils/xmlUtils.js';
import { mapHamToMpd } from './mpd/mapHamToMpd.js';

export class MPDMapper implements IMapper {
	//TODO : Handle SegmentTemplate and SegmentList

	toHam(manifest: Manifest): Presentation[] {
		const dashManifest: MPDManifest | undefined = xmlToJson(manifest.main);

		if (!dashManifest) {
			return [];
		}

		return mapMpdToHam(dashManifest);
	}

	toManifest(presentation: Presentation[]): Manifest {
		const jsonMpd = mapHamToMpd(presentation);

		if (!jsonMpd) {
			return { main: '', playlists: [], type: 'mpd' };
		}

		const mpd = jsonToXml(jsonMpd);
		return { main: mpd, playlists: [], type: 'mpd' };
	}
}
