import type { HlsManifest } from '../../types/mapper/hls/HlsManifest.ts';

export type HlsParser = (text: string) => HlsManifest;

let hlsParser: HlsParser;

/**
 * @internal
 */
export function setHlsParser(parser: HlsParser): void {
	hlsParser = parser;
}

/**
 * @internal
 */
export function getHlsParser(): HlsParser {
	return hlsParser;
}

export function parseHlsManifest(text?: string): HlsManifest {
	if (!text) {
		console.error("Can't parse empty HLS Manifest");
		return {} as HlsManifest;
	}

	return hlsParser(text);
}
