import { Builder, parseString } from 'xml2js';
import { MPD } from './dash/DashManifest.js';

function xmlToJson(raw: string, replace: (manifest: MPD) => void): void {
	return parseString(raw, (err: Error | null, result: MPD) => {
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
