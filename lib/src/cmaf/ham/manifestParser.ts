import { xmlToJson } from '../utils/xml.js';
import { DashManifest } from '../utils/dash/DashManifest.js';
import { mapMpdToHam } from './hamMapper.js';
import { Presentation } from './model/index.js';

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


export async function mpdToHam(manifest: string): Promise<Presentation | null> {
	let dashManifest: DashManifest | undefined;
	await xmlToJson(manifest, (result: DashManifest) => dashManifest = result);

	if (!dashManifest) {
		return null;
	}

	return mapMpdToHam(dashManifest);
}
