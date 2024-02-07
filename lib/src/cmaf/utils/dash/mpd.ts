// @ts-ignore
import { parse } from 'mpd-parser';
import { parseString } from 'xml2js';
import { DashManifest } from './DashManifest';

export async function parseMpd(raw: string, replace: (manifest: DashManifest) => void) {
	return parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		replace(result);
	});
}

// export function parseMpdVideo(text: string, uri: string) {
// 	const parsedDash = parse(text, { uri });
//
// 	if (!parsedDash) {
// 		throw new Error();
// 	}
//
// 	return parsedDash;
// }
