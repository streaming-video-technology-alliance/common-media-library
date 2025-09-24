import type { WebVttCue } from './WebVttCue.js';
import { WebVttParser } from './WebVttParser.js';
import type { WebVttParseResult } from './WebVttParseResult.js';
import type { WebVttParserOptions } from './WebVttParserOptions.js';
import type { WebVttParsingError } from './WebVttParsingError.js';
import type { WebVttRegion } from './WebVttRegion.js';

/**
 * Parse a WebVTT string into a WebVttParseResult.
 *
 * @param text - The WebVTT string to parse.
 * @param options - The options to use for the parser.
 * @returns The parsed WebVttParseResult.
 *
 * @group WebVTT
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/webvtt/parseWebVtt.test.ts#example}
 */
export async function parseWebVtt(text: string, options?: WebVttParserOptions): Promise<WebVttParseResult> {
	const parser = new WebVttParser(options);
	const cues: WebVttCue[] = [];
	const regions: WebVttRegion[] = [];
	const styles: string[] = [];
	const errors: WebVttParsingError[] = [];
	parser.oncue = cue => cues.push(cue);
	parser.onregion = region => regions.push(region);
	parser.onstyle = style => styles.push(style);
	parser.onparsingerror = error => errors.push(error);
	parser.parse(text);
	parser.flush();

	return { cues, regions, styles, errors };
}
