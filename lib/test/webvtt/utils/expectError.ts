import type { WebVttParsingError } from '@svta/common-media-library/webvtt';
import { WebVttParser } from '@svta/common-media-library/webvtt';
import { equal } from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { options } from './options.ts';

export async function expectError(vttFile: string, error: string): Promise<void> {
	const vttText = await readFile(path.resolve(vttFile), 'utf-8');

	let parseError: WebVttParsingError | undefined;
	const parser = new WebVttParser(options);
	parser.onparsingerror = (error: WebVttParsingError) => parseError = error;
	parser.parse(vttText);
	parser.flush();

	equal(parseError?.name, error);
}
