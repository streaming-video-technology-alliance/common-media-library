import { setDashParser, setDashSerializer, setHlsParser, type DashManifest, type HlsManifest } from '@svta/cml-cmaf-ham';
import { Parser } from 'm3u8-parser';
import { Builder, parseString } from 'xml2js';

setDashParser((raw: string) => {
	// `parsed` is populated by the synchronous `parseString` callback
	// so we need to explicitly tell Typescript that it is not undefined.
	let parsed!: DashManifest;

	parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}

		parsed = result;
	});

	return parsed;
});

setHlsParser((text: string) => {
	const parser = new Parser();

	parser.push(text);
	parser.end();

	// This force cast, and the one in the return statement, are necessary
	// because Typescript cannot reconcile the `Manifest` and `HlsManifest`
	// types, even though they are the overlap.
	const parsedHlsManifest = parser.manifest as any;
	if (!parsedHlsManifest) {
		throw new Error();
	}

	return parsedHlsManifest as HlsManifest;
});

setDashSerializer((manifest: DashManifest) => {
	const builder = new Builder();
	return builder.buildObject(manifest);
});
