import { parseString, Builder } from 'xml2js';
import { DashManifest } from './dash/DashManifest.js';

async function xmlToJson(
	raw: string,
	replace: (manifest: DashManifest) => void
): Promise<void> {
	return parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		replace(result);
	});
}

async function jsonToXml(json: object): Promise<string> {
	const builder = new Builder();
	return builder.buildObject(json);
}

export { xmlToJson, jsonToXml };
