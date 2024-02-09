import { parseString } from 'xml2js';
import { DashManifest } from './DashManifest.js';

export async function parseMpd(raw: string, replace: (manifest: DashManifest) => void) {
	return parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		replace(result);
	});
}
