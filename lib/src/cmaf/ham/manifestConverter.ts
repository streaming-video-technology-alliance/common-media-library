import { jsonToXml, xmlToJson } from '../utils/xml.js';
import { DashManifest } from '../utils/dash/DashManifest.js';
import { mapMpdToHam } from './hamMapper.js';
import { Presentation } from './model/index.js';
import { mapHamToMpd } from '../utils/dash/mpdMapper.js';

export async function readHLS(manifestUrl: string): Promise<string> {
	const response = await fetch(manifestUrl, {
		headers: {
			'Content-Type': 'application/vnd.apple.mpegurl',
		},
	});
	return response.text();
}


export async function m3u8toHam() {

}


async function mpdToHam(manifest: string): Promise<Presentation | null> {
	let dashManifest: DashManifest | undefined;
	await xmlToJson(manifest, (result: DashManifest) => dashManifest = result);

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

export { mpdToHam, hamToMpd };
