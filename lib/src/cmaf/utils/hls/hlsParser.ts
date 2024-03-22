// @ts-ignore
import { Parser } from 'm3u8-parser';

export function parseHlsManifest(text: string | undefined) {
	if (!text) {
		console.error("Can't parse empty HLS Manifest");
		return {};
	}

	const parser = new Parser();

	parser.push(text);
	parser.end();
	const parsedHlsManifest = parser.manifest;
	if (!parsedHlsManifest) {
		throw new Error();
	}

	return parsedHlsManifest;
}
