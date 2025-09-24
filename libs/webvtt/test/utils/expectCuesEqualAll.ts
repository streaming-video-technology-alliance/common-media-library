import { parseWebVtt } from '@svta/common-media-library/webvtt/parseWebVtt.js';
import type { WebVttParsingError } from '@svta/common-media-library/webvtt/WebVttParsingError.js';
import { deepEqual } from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { options } from './options.ts';

export async function expectCuesEqualAll(vttFile: string, jsonFile: string, message?: string): Promise<void> {
	const [vttText, json] = await Promise.all([
		readFile(path.resolve(vttFile), 'utf-8'),
		readFile(path.resolve(jsonFile), 'utf-8').then(text => JSON.parse(text)),
	]);

	const { cues, regions, styles, errors } = await parseWebVtt(vttText, options);

	for (let i = 0; i < cues.length; i++) {
		deepEqual(cues[i], json.cues[i], message);
	}

	for (let i = 0; i < regions.length; i++) {
		deepEqual(regions[i], json.regions[i], message);
	}

	for (let i = 0; i < styles.length; i++) {
		deepEqual(styles[i], json.styles[i], message);
	}

	const messages = errors.map((error: WebVttParsingError) => error.toString());
	for (let i = 0; i < errors.length; i++) {
		deepEqual(messages[i], json.errors[i], message);
	}

	// deepEqual(cues, json, message);
}
