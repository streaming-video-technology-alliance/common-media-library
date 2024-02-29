import { Presentation } from '../types/model/index.js';
import { mpdToHam } from './mpd/mpdToHam.js';
import { MPDManifest } from '../types/DashManifest.js';
import { hamToMpd } from './mpd/hamToMpd.js';
import { xmlToJson } from '../../utils/xmlUtils.js';

type mapMpdType = {
	toHam: (rawManifest: string) => Presentation[];
	fromHam: (presentations: Presentation[]) => MPDManifest;
};

const mapMpd: mapMpdType = {
	toHam: (rawManifest: string): Presentation[] => {
		const dashManifest: MPDManifest | undefined = xmlToJson(rawManifest);

		if (!dashManifest) {
			return [];
		}

		return mpdToHam(dashManifest);
	},
	fromHam: (presentations: Presentation[]): MPDManifest =>
		hamToMpd(presentations),
};

export { mapMpd };
