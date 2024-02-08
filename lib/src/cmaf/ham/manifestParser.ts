import { parseMpd } from '../utils/dash/mpd';
import { DashManifest } from '../utils/dash/DashManifest';
import { mapMpdToHam } from './hamMapper';

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


export async function mpdToHam(manifest: string) {
	let dashManifest: DashManifest | undefined;
	await parseMpd(manifest, (result: DashManifest) => dashManifest = result);

	if (!dashManifest) {
		return;
	}

	return mapMpdToHam(dashManifest);
}
