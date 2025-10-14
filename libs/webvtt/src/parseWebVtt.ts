import type { WebVttCue } from './WebVttCue.ts'
import { WebVttParser } from './WebVttParser.ts'
import type { WebVttParseResult } from './WebVttParseResult.ts'
import type { WebVttParserOptions } from './WebVttParserOptions.ts'
import type { WebVttParsingError } from './WebVttParsingError.ts'
import type { WebVttRegion } from './WebVttRegion.ts'

/**
 * Parse a WebVTT string into a WebVttParseResult.
 *
 * @param text - The WebVTT string to parse.
 * @param options - The options to use for the parser.
 * @returns The parsed WebVttParseResult.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/parseWebVtt.test.ts#example}
 */
export async function parseWebVtt(text: string, options?: WebVttParserOptions): Promise<WebVttParseResult> {
	const parser = new WebVttParser(options)
	const cues: WebVttCue[] = []
	const regions: WebVttRegion[] = []
	const styles: string[] = []
	const errors: WebVttParsingError[] = []
	parser.oncue = cue => cues.push(cue)
	parser.onregion = region => regions.push(region)
	parser.onstyle = style => styles.push(style)
	parser.onparsingerror = error => errors.push(error)
	parser.parse(text)
	parser.flush()

	return { cues, regions, styles, errors }
}
