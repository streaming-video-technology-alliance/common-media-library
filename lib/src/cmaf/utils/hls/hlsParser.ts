// @ts-ignore
import { Parser } from 'm3u8-parser';

export function parseHlsManifest(text: string) {
	const parser = new Parser();

	parser.push(text);
	parser.end();
	const parsedHlsManifest = parser.manifest;
	if (!parsedHlsManifest) {
		throw new Error();
	}

	return parsedHlsManifest;
}
