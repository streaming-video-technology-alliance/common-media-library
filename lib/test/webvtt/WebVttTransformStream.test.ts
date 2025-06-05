import { WebVttResultType } from '@svta/common-media-library/webvtt/WebVttResultType.js';
import { WebVttTransformStream } from '@svta/common-media-library/webvtt/WebVttTransformStream.js';
import { equal } from 'node:assert';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import './utils/pollyfill.ts';

// NOTE: This "polyfill" is here to make the example look like a browser fetch.
function fetch(path: string): Promise<{ body: ReadableStream<any> }> {
	const body = Readable.toWeb(createReadStream(resolve(path))) as ReadableStream<any>;
	return Promise.resolve({ body });
}

describe('WebVttTransformStream examples', () => {
	it('provides a valid example', async () => {
		//#region example
		const response = await fetch('./test/webvtt/regions/region.vtt');
		const stream = response.body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(new WebVttTransformStream());

		const results: any[] = [];

		for await (const result of stream) {
			results.push(result);
		}

		equal(results.length, 11);
		equal(results.filter(result => result.type === WebVttResultType.CUE).length, 7);
		equal(results.filter(result => result.type === WebVttResultType.REGION).length, 2);
		equal(results.filter(result => result.type === WebVttResultType.STYLE).length, 2);
		equal(results.filter(result => result.type === WebVttResultType.ERROR).length, 0);
		//#endregion example
	});
});
