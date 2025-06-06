import { describe, it } from 'node:test';
import { expectError } from '../utils/expectError.ts';

describe('parsing error tests', function () {

	it('parsing error tests', async () => {
		var testInfo = [{
			file: './test/webvtt/file-layout/blank-file.vtt',
			name: 'WebVttParsingError',
			code: 0,
		}, {
			file: './test/webvtt/cue-times/fraction-digits.vtt',
			name: 'WebVttParsingError',
			code: 1,
		}];

		await expectError(testInfo[0].file, testInfo[0].name);
		await expectError(testInfo[1].file, testInfo[1].name);
	});
});
