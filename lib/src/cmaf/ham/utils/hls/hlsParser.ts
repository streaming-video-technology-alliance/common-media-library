// @ts-ignore
import { Parser } from 'm3u8-parser';
import { HlsManifest } from '../../types';

export function parseHlsManifest(text: string | undefined): HlsManifest {
	if (!text) {
		console.error("Can't parse empty HLS Manifest");
		return {} as HlsManifest;
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
