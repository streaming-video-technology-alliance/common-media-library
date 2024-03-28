import { Builder, parseString } from 'xml2js';
import type { DashManifest } from '../ham/types/mappers/DashManifest.js';

/**
 * @internal
 * Parse XML to Json
 *
 * @param raw - Raw string containing the xml from the Dash Manifest
 * @returns json with the Dash Manifest structure
 */
function xmlToJson(raw: string): DashManifest | undefined {
	let parsed: DashManifest | undefined;
	parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		parsed = result as DashManifest;
	});
	return parsed;
}

function jsonToXml(json: object): string {
	const builder = new Builder();
	return builder.buildObject(json);
}

export { xmlToJson, jsonToXml };
