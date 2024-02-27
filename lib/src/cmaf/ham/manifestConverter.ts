import { Presentation } from './types/model/index.js';
import { jsonToXml, xmlToJson } from '../utils/xml.js';
import { mapMpdToHam } from './hamMapper.js';
import { mapHamToMpd } from '../utils/dash/mpdMapper.js';
import type { DashManifest } from '../utils/dash/DashManifest.js';

async function mpdToHam(manifest: string): Promise<Presentation | null> {
	let dashManifest: DashManifest | undefined;
	await xmlToJson(
		manifest,
		(result: DashManifest) => (dashManifest = result),
	);

	if (!dashManifest) {
		return null;
	}

	return mapMpdToHam(dashManifest);
}

async function hamToMpd(ham: Presentation): Promise<string | null> {
	const jsonMpd = mapHamToMpd(ham);

	if (!jsonMpd) {
		return null;
	}

	return await jsonToXml(jsonMpd);
}

export { hamToMpd, mpdToHam };
