import {
	Presentation,
} from './model/index.js';
import { parseMpd } from '../utils/dash/mpd.js';
import { mapMpdToHam } from './hamMapper.js';
import type { DashManifest } from '../utils/dash/DashManifest.js';


async function mpdToHam(manifest: string): Promise<Presentation | null> {
	let dashManifest: DashManifest | undefined;
	await parseMpd(manifest, (result: DashManifest) => dashManifest = result);

	if (!dashManifest) {
		return null;
	}

	return mapMpdToHam(dashManifest);
}

export { mpdToHam };


