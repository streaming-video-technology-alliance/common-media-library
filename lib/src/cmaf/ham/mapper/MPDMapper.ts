import { DashManifest } from '../../utils/dash/DashManifest.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { mapMpdToHam } from '../../utils/dash/formatter.js';
import { xmlToJson, jsonToXml } from '../../utils/xmlUtils.js';
import { mapHamToMpd } from '../../utils/dash/mpdMapper.js';
export class MPDMapper implements IMapper {
	//TODO : Handle SegmentTemplate and SegmentList

	toHam(manifest: Manifest): Presentation[] {
		let dashManifest: DashManifest | undefined;
		xmlToJson(
			manifest.main,
			(result: DashManifest) => (dashManifest = result),
		);

		if (!dashManifest) {
			return [];
		}

		const presentation = mapMpdToHam(dashManifest);
		return [presentation];
	}

	toManifest(presentation: Presentation[]): Manifest {
		//TODO: Handle multiple presentations
		const jsonMpd = mapHamToMpd(presentation[0]);

		if (!jsonMpd) {
			return { main: '', playlists: [], type: 'mpd' };
		}

		const mpd = jsonToXml(jsonMpd);
		return { main: mpd, playlists: [], type: 'mpd' };
	}
}
