import type { DashManifest } from '../../types/mapper/dash/DashManifest';

export type DashParser = (raw: string) => DashManifest;

let dashParser: DashParser;

/**
 * @internal
 */
export function setDashParser(parser: DashParser): void {
	dashParser = parser;
}

/**
 * @internal
 */
export function getDashParser(): DashParser {
	return dashParser;
}

/**
 * @internal
 * Parse XML to Json
 *
 * @param raw - Raw string containing the xml from the Dash Manifest
 * @returns json with the Dash Manifest structure
 */
export function parseDashManifest(raw: string): DashManifest {
	return dashParser(raw);
}
