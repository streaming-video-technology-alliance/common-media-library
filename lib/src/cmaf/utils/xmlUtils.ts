import { parseString, Builder } from 'xml2js';
import { DashManifest } from './dash/DashManifest.js';

function xmlToJson(
	raw: string,
	replace: (manifest: DashManifest) => void,
): void {
	return parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		replace(result);
	});
}

function jsonToXml(json: object): string {
	const builder = new Builder();
	return builder.buildObject(json);
}

export { xmlToJson, jsonToXml };
