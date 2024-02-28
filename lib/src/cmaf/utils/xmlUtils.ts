import { Builder, parseString } from 'xml2js';
import { MPDManifest } from '../ham/types/DashManifest.js';

function xmlToJson(raw: string): MPDManifest | undefined {
	let parsed: MPDManifest | undefined;
	parseString(raw, (err: Error | null, result: MPDManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		parsed = result as MPDManifest;
	});
	return parsed;
}

function jsonToXml(json: object): string {
	const builder = new Builder();
	return builder.buildObject(json);
}

export { xmlToJson, jsonToXml };
