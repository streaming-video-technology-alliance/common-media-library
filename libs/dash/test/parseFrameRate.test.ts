import { parseFrameRate } from '@svta/cml-dash';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('parseFramerate', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = parseFrameRate('24000/1001');

		equal(result, 23.976023976023978);
		//#endregion example
	});

	it('handles integer framerates', async () => {
		const result = parseFrameRate('30');

		equal(result, 30);
	});

	it('returns NaN for invalid framerates', async () => {
		equal(parseFrameRate('test'), NaN);
		equal(parseFrameRate('30/0'), NaN);
	});
});
