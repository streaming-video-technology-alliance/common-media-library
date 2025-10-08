import type { WebVttCue } from './WebVttCue.js';
import type { WebVttParsingError } from './WebVttParsingError.js';
import type { WebVttRegion } from './WebVttRegion.js';

/**
 * The result of parsing a WebVTT string.
 *
 *
 * @beta
 */
export type WebVttParseResult = {
	/**
	 * The cues parsed from the WebVTT string.
	 */
	cues: WebVttCue[];

	/**
	 * The regions parsed from the WebVTT string.
	 */
	regions: WebVttRegion[];

	/**
	 * The styles parsed from the WebVTT string.
	 */
	styles: string[];

	/**
	 * The errors that occurred while parsing the WebVTT string.
	 */
	errors: WebVttParsingError[];
};
