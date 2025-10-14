import { createWebVttCue } from './createWebVttCue.ts';
import { createWebVttRegion } from './createWebVttRegion.ts';
import { parseCue } from './parse/parseCue.ts';
import { parseOptions } from './parse/parseOptions.ts';
import { parseTimeStamp } from './parse/parseTimestamp.ts';
import { Settings } from './parse/Settings.ts';
import { WebVttParserState } from './parse/WebVttParserState.ts';
import type { TimestampMap } from './TimestampMap.ts';
import type { WebVttCue } from './WebVttCue.ts';
import type { WebVttCueFactory } from './WebVttCueFactory.ts';
import type { WebVttParserOptions } from './WebVttParserOptions.ts';
import { WebVttParsingError } from './WebVttParsingError.ts';
import type { WebVttRegion } from './WebVttRegion.ts';
import type { WebVttRegionFactory } from './WebVttRegionFactory.ts';

const BAD_SIGNATURE = 'Malformed WebVTT signature.';
const createCue = (): WebVttCue => typeof VTTCue !== 'undefined' ? new VTTCue(0, 0, '') : createWebVttCue();
const createRegion = (): WebVttRegion => typeof VTTRegion !== 'undefined' ? new VTTRegion() : createWebVttRegion();

/**
 * A WebVTT parser.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/WebVttParser.test.ts#example}
 *
 * @see {@link https://www.w3.org/TR/webvtt1/ | WebVTT Specification}
 */
export class WebVttParser {
	private state: WebVttParserState;
	private buffer: string;
	private regionList: WebVttRegion[];
	private regionSettings: Settings | null = null;
	private style: string;
	private cue: WebVttCue | null = null;
	private createCue: WebVttCueFactory;
	private createRegion: WebVttRegionFactory;

	/**
	 * A callback function that is called when a parsing error occurs.
	 */
	onparsingerror?: (error: WebVttParsingError) => void;

	/**
	 * A callback function that is called when a region is parsed.
	 */
	onregion?: (region: WebVttRegion) => void;

	/**
	 * A callback function that is called when a timestamp map is parsed.
	 */
	ontimestampmap?: (timestampMap: TimestampMap) => void;

	/**
	 * A callback function that is called when a cue is parsed.
	 */
	oncue?: (cue: WebVttCue) => void;

	/**
	 * A callback function that is called when a style is parsed.
	 */
	onstyle?: (style: string) => void;

	/**
	 * A callback function that is called when the parser is flushed.
	 */
	onflush?: () => void;

	/**
	 * Create a new WebVTT parser.
	 *
	 * @param options - The options to use for the parser.
	 */
	constructor(options: WebVttParserOptions = {}) {
		const useDomTypes = options.useDomTypes ?? true;
		this.createCue = options.createCue || useDomTypes ? createCue : createWebVttCue;
		this.createRegion = options.createRegion || useDomTypes ? createRegion : createWebVttRegion;

		this.state = WebVttParserState.INITIAL;
		this.buffer = '';
		this.style = '';
		this.regionList = [];
	}

	/**
	 * Parse the given data.
	 *
	 * @param data - The data to parse.
	 * @param reuseCue - Whether to reuse the cue.
	 * @returns The parser.
	 */
	parse(data?: string, reuseCue: boolean = false): WebVttParser {
		// If there is no data then we will just try to parse whatever is in buffer already.
		// This may occur in circumstances, for example when flush() is called.
		if (data) {
			this.buffer += data;
		}

		const collectNextLine = (): string => {
			const buffer = this.buffer;
			let pos = 0;
			while (pos < buffer.length && buffer[pos] !== '\r' && buffer[pos] !== '\n') {
				++pos;
			}
			const line = buffer.substr(0, pos);
			// Advance the buffer early in case we fail below.
			if (buffer[pos] === '\r') {
				++pos;
			}
			if (buffer[pos] === '\n') {
				++pos;
			}
			this.buffer = buffer.substr(pos);
			return line;
		};

		// draft-pantos-http-live-streaming-20
		// https://tools.ietf.org/html/draft-pantos-http-live-streaming-20#section-3.5
		// 3.5 WebVTT
		const parseTimestampMap = (input: string): void => {
			const settings = new Settings();

			parseOptions(input, (k: string, v: string): void => {
				switch (k) {
					case 'MPEGT':
						settings.integer(k + 'S', v);
						break;
					case 'LOCA':
						settings.set(k + 'L', parseTimeStamp(v));
						break;
				}
			}, /[^\d]:/, /,/);

			this.ontimestampmap?.({
				'MPEGTS': settings.get('MPEGTS'),
				'LOCAL': settings.get('LOCAL'),
			});
		};

		// 3.2 WebVtt metadata header syntax
		const parseHeader = (input: string): void => {
			if (input.match(/X-TIMESTAMP-MAP/)) {
				// This line contains HLS X-TIMESTAMP-MAP metadata
				parseOptions(input, (k: string, v: string): void => {
					switch (k) {
						case 'X-TIMESTAMP-MAP':
							parseTimestampMap(v);
							break;
					}
				}, /=/);
			}
		};

		// 6.1 WebVTT file parsing.
		try {
			let line!: string;

			if (this.state === WebVttParserState.INITIAL) {
				// We can't start parsing until we have the first line.
				if (!/\r\n|\n/.test(this.buffer)) {
					return this;
				}

				line = collectNextLine();

				// Remove the UTF-8 BOM if it exists.
				if (line.charCodeAt(0) === 0xFEFF) {
					line = line.slice(1);
				}

				const m = line.match(/^WEBVTT([ \t].*)?$/);
				if (!m || !m[0]) {
					throw new WebVttParsingError(BAD_SIGNATURE);
				}

				this.state = WebVttParserState.HEADER;
			}

			let alreadyCollectedLine = false;
			let sawCue = reuseCue;

			if (!reuseCue) {
				this.cue = null;
				this.regionSettings = null;
			}

			while (this.buffer) {
				// We can't parse a line until we have the full line.
				if (!/\r\n|\n/.test(this.buffer)) {
					return this;
				}

				if (!alreadyCollectedLine) {
					line = collectNextLine();
				}
				else {
					alreadyCollectedLine = false;
				}

				switch (this.state) {
					case WebVttParserState.HEADER:
						// 13-18 - Allow a header (metadata) under the WEBVTT line.
						if (/:/.test(line)) {
							parseHeader(line);
						}
						else if (!line) {
							// An empty line terminates the header and blocks section.
							this.state = WebVttParserState.BLOCKS;
						}
						continue;

					case WebVttParserState.REGION:
						if (!line && this.regionSettings) {
							// create the region
							const region = this.createRegion();
							region.id = this.regionSettings.get('id', '');
							region.width = this.regionSettings.get('width', 100);
							region.lines = this.regionSettings.get('lines', 3);
							region.regionAnchorX = this.regionSettings.get('regionanchorX', 0);
							region.regionAnchorY = this.regionSettings.get('regionanchorY', 100);
							region.viewportAnchorX = this.regionSettings.get('viewportanchorX', 0);
							region.viewportAnchorY = this.regionSettings.get('viewportanchorY', 100);
							region.scroll = this.regionSettings.get('scroll', '');

							// Register the region.
							this.onregion?.(region);

							// Remember the VTTRegion for later in case we parse any VTTCues that reference it.
							this.regionList.push(region);

							// An empty line terminates the REGION block
							this.regionSettings = null;
							this.state = WebVttParserState.BLOCKS;
							break;
						}

						// if it's a new region block, create a new VTTRegion
						if (this.regionSettings === null) {
							this.regionSettings = new Settings();
						}

						const regionSettings = this.regionSettings;

						// parse region options and set it as appropriate on the region
						parseOptions(line, (k, v) => {
							switch (k) {
								case 'id':
									regionSettings.set(k, v);
									break;
								case 'width':
									regionSettings.percent(k, v);
									break;
								case 'lines':
									regionSettings.integer(k, v);
									break;
								case 'regionanchor':
								case 'viewportanchor':
									const xy = v.split(',');
									if (xy.length !== 2) {
										break;
									}
									// We have to make sure both x and y parse, so use a temporary
									// settings object here.
									const anchor = new Settings();
									anchor.percent('x', xy[0]);
									anchor.percent('y', xy[1]);
									if (!anchor.has('x') || !anchor.has('y')) {
										break;
									}
									regionSettings.set(k + 'X', anchor.get('x'));
									regionSettings.set(k + 'Y', anchor.get('y'));
									break;
								case 'scroll':
									regionSettings.alt(k, v, ['up']);
									break;
							}
						}, /:/, /\s/);
						continue;

					case WebVttParserState.STYLE:
						if (!line) {
							this.onstyle?.(this.style);
							this.style = '';
							this.state = WebVttParserState.BLOCKS;
							break;
						}
						this.style += line + '\n';
						continue;

					case WebVttParserState.NOTE:
						// Ignore NOTE blocks.
						if (!line) {
							this.state = WebVttParserState.ID;
						}
						continue;

					case WebVttParserState.BLOCKS:
						if (!line) {
							continue;
						}

						// Check for the start of a NOTE blocks
						if (/^NOTE($[ \t])/.test(line)) {
							this.state = WebVttParserState.NOTE;
							break;
						}

						// Check for the start of a REGION blocks
						if (/^REGION/.test(line) && !sawCue) {
							this.state = WebVttParserState.REGION;
							break;
						}

						// Check for the start of a STYLE blocks
						if (/^STYLE/.test(line) && !sawCue) {
							this.state = WebVttParserState.STYLE;
							break;
						}

						this.state = WebVttParserState.ID;
					// Process line as an ID.
					/* falls through */
					case WebVttParserState.ID:
						// Check for the start of NOTE blocks.
						if (/^NOTE($|[ \t])/.test(line)) {
							this.state = WebVttParserState.NOTE;
							break;
						}
						// 19-29 - Allow any number of line terminators, then initialize new cue values.
						if (!line) {
							continue;
						}

						sawCue = true;

						this.cue = this.createCue();
						this.cue.text ??= '';

						this.state = WebVttParserState.CUE;
						// 30-39 - Check if this line contains an optional identifier or timing data.
						if (line.indexOf('-->') === -1) {
							this.cue.id = line;
							continue;
						}
					// Process line as start of a cue.
					/*falls through*/
					case WebVttParserState.CUE:
						// 40 - Collect cue timings and settings.
						try {
							parseCue(line, this.cue!, this.regionList);
						}
						catch (e) {
							this.reportOrThrowError(e);
							// In case of an error ignore rest of the cue.
							this.cue = null;
							this.state = WebVttParserState.BAD_CUE;
							continue;
						}
						this.state = WebVttParserState.CUE_TEXT;
						continue;

					case WebVttParserState.CUE_TEXT:
						const hasSubstring = line.indexOf('-->') !== -1;

						// 34 - If we have an empty line then report the cue.
						// 35 - If we have the special substring '-->' then report the cue,
						// but do not collect the line as we need to process the current
						// one as a new cue.
						if (!line || hasSubstring && (alreadyCollectedLine = true)) {
							// We are done parsing this cue.
							this.oncue?.(this.cue!);
							this.cue = null;
							this.state = WebVttParserState.ID;
							continue;
						}
						if (this.cue?.text) {
							this.cue.text += '\n';
						}
						this.cue!.text += line.replace(/\u2028/g, '\n').replace(/u2029/g, '\n');
						continue;

					case WebVttParserState.BAD_CUE: // BADCUE
						// 54-62 - Collect and discard the remaining cue.
						if (!line) {
							this.state = WebVttParserState.ID;
						}
						continue;
				}
			}
		}
		catch (e) {
			this.reportOrThrowError(e);

			// If we are currently parsing a cue, report what we have.
			if (this.state === WebVttParserState.CUE_TEXT && this.cue && this.oncue) {
				this.oncue(this.cue);
			}
			this.cue = null;
			this.regionSettings = null;

			// Enter BADWEBVTT state if header was not parsed correctly otherwise
			// another exception occurred so enter BADCUE state.
			this.state = this.state === WebVttParserState.INITIAL ? WebVttParserState.BAD_WEBVTT : WebVttParserState.BAD_CUE;
		}
		return this;
	}

	/**
	 * Flush the parser.
	 *
	 * @returns The parser.
	 */
	flush(): WebVttParser {
		try {
			// Finish parsing the stream.
			this.buffer += '';
			// Synthesize the end of the current cue or region.
			if (this.cue || this.state === WebVttParserState.HEADER) {
				this.buffer += '\n\n';
				this.parse(undefined, true);
			}
			// If we've flushed, parsed, and we're still on the INITIAL state then
			// that means we don't have enough of the stream to parse the first
			// line.
			if (this.state === WebVttParserState.INITIAL) {
				throw new WebVttParsingError(BAD_SIGNATURE);
			}
		}
		catch (e) {
			this.reportOrThrowError(e);
		}

		this.onflush?.();

		return this;
	}

	// If the error is a ParsingError then report it to the consumer if
	// possible. If it's not a ParsingError then throw it like normal.
	private reportOrThrowError(error: any): void {
		if (error instanceof WebVttParsingError) {
			this.onparsingerror?.(error);
		}
		else {
			throw error;
		}
	}
}
