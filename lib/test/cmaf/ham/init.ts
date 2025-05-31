import { setDashParser, setDashSerializer, setHlsParser, type DashManifest, type HlsManifest } from '@svta/common-media-library';
import { Parser } from 'm3u8-parser';
import { Builder, parseString } from 'xml2js';

setDashParser((raw: string) => {
	let parsed: DashManifest;
	parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message);
		}
		parsed = result as DashManifest;
	});
	// @ts-ignore
	return parsed;
});

setHlsParser((text: string) => {
	const parser = new Parser();

	parser.push(text);
	parser.end();
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
