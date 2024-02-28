import { Presentation } from '../types/model/index.js';
import { mapMpdToHam } from './mpd/mapMpdToHam.js';
import { MPDManifest } from '../types/DashManifest.js';
import { mapHamToMpd } from './mpd/mapHamToMpd.js';
import { xmlToJson } from '../../utils/xmlUtils.js';

const mapMpd = {
	toHam: (rawManifest: string): Presentation[] => {
		const dashManifest: MPDManifest | undefined = xmlToJson(rawManifest);

		if (!dashManifest) {
			return [];
		}

		return mapMpdToHam(dashManifest);
	},
	fromHam: (presentations: Presentation[]): MPDManifest =>
		mapHamToMpd(presentations),
};

export { mapMpd };
