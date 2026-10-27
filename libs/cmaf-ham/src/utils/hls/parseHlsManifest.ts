import type { HlsManifest } from '../../types/mapper/hls/HlsManifest.ts'

/**
 * @internal
 */
export type HlsParser = (text: string) => HlsManifest

let hlsParser: HlsParser

/**
 * @internal
 */
export function setHlsParser(parser: HlsParser): void {
	hlsParser = parser
}

/**
 * @internal
 */
export function getHlsParser(): HlsParser {
	return hlsParser
}

/**
 * @internal
 *
 * Parse an HLS manifest with the parser from `setHlsParser`.
 *
 * @param text - Text of the manifest
 * @returns parsed manifest. In case the text is empty, returns an empty object.
 */
export function parseHlsManifest(text?: string): HlsManifest {
	if (!text) {
		return {} as HlsManifest
	}

	return hlsParser(text)
}
