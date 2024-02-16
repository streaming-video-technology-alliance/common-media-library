import { parseString } from 'xml2js';
import { DashManifest } from './dash/DashManifest.js';

export async function xmlToJson(raw: string, replace: (manifest: DashManifest) => void): Promise<void> {
	return parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		replace(result);
	});
}
