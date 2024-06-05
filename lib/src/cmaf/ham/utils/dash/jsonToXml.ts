import { Builder } from 'xml2js';

export function jsonToXml(json: object): string {
	const builder = new Builder();
	return builder.buildObject(json);
}
