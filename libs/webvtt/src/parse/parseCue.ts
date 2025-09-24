import type { WebVttCue } from '../WebVttCue.js';
import { WebVttParsingError } from '../WebVttParsingError.js';
import type { WebVttRegion } from '../WebVttRegion.js';
import { parseOptions } from './parseOptions.js';
import { parseTimeStamp } from './parseTimestamp.js';
import { Settings } from './Settings.js';

const BAD_TIMESTAMP = 'Malformed time stamp.';

export function parseCue(input: string, cue: WebVttCue, regionList: WebVttRegion[]): void {
	// Remember the original input if we need to throw an error.
	const oInput = input;
	// 4.1 WebVTT timestamp
	function consumeTimeStamp() {
		const ts = parseTimeStamp(input);
		if (ts === null) {
			throw new WebVttParsingError(BAD_TIMESTAMP + oInput);
		}
		// Remove time stamp from input.
		input = input.replace(/^[^\sa-zA-Z-]+/, '');
		return ts;
	}

	// 4.4.2 WebVTT cue settings
	function consumeCueSettings(input: string, cue: WebVttCue): void {
		const settings = new Settings();

		parseOptions(input, function (k, v) {
			switch (k) {
				case 'region': {
					// Find the last region we parsed with the same region id.
					for (let i = regionList.length - 1; i >= 0; i--) {
						if (regionList[i].id === v) {
							settings.set(k, regionList[i]);
							break;
						}
					}
					break;
				}
				case 'vertical': {
					settings.alt(k, v, ['rl', 'lr']);
					break;
				}
				case 'line': {
					const vals = v.split(',');
					const vals0 = vals[0];
					settings.integer(k, vals0);
					settings.percent(k, vals0) ? settings.set('snapToLines', false) : null;
					settings.alt(k, vals0, ['auto']);
					if (vals.length === 2) {
						settings.alt('lineAlign', vals[1], ['start', 'center', 'end']);
					}
					break;
				}
				case 'position': {
					const vals = v.split(',');
					settings.percent(k, vals[0]);
					if (vals.length === 2) {
						settings.alt('positionAlign', vals[1], ['line-left', 'center', 'line-right', 'auto']);
					}
					break;
				}
				case 'size': {
					settings.percent(k, v);
					break;
				}
				case 'align': {
					settings.alt(k, v, ['start', 'center', 'end', 'left', 'right']);
					break;
				}
			}
		}, /:/, /\s/);

		// Apply default values for any missing fields.
		cue.region = settings.get('region', null);
		cue.vertical = settings.get('vertical', '');
		try {
			cue.line = settings.get('line', 'auto');
		}
		catch (e) {
			// eslint-ignore-line
		}
		cue.lineAlign = settings.get('lineAlign', 'start');
		cue.snapToLines = settings.get('snapToLines', true);
		cue.size = settings.get('size', 100);
		// Safari still uses the old middle value and won't accept center
		try {
			cue.align = settings.get('align', 'center');
		}
		catch (e) {
			cue.align = settings.get('align', 'middle' as AlignSetting);
		}
		try {
			cue.position = settings.get('position', 'auto');
		}
		catch (e) {
			const positions = {
				start: 0,
				left: 0,
				center: 50,
				middle: 50,
				end: 100,
				right: 100,
			};

			cue.position = settings.get('position', positions[cue.align]);
		}

		cue.positionAlign = settings.get('positionAlign', 'auto');
	}

	function skipWhitespace() {
		input = input.replace(/^\s+/, '');
	}

	// 4.1 WebVTT cue timings.
	skipWhitespace();
	cue.startTime = consumeTimeStamp();   // (1) collect cue start time
	skipWhitespace();
	if (input.substr(0, 3) !== '-->') {     // (3) next characters must match "-->"
		throw new WebVttParsingError(BAD_TIMESTAMP + " (time stamps must be separated by '-->'): ");
	}
	input = input.substr(3);
	skipWhitespace();
	cue.endTime = consumeTimeStamp();     // (5) collect cue end time

	// 4.1 WebVTT cue settings list.
	skipWhitespace();
	consumeCueSettings(input, cue);
}
