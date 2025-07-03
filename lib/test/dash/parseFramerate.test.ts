import { parseFramerate } from '@svta/common-media-library/dash';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('parseFramerate', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = parseFramerate('24000/1001');

		equal(result, 23.976023976023978);
		//#endregion example
	});

	it('handles integer framerates', async () => {
		const result = parseFramerate('30');

		equal(result, 30);
	});

	it('returns NaN for invalid framerates', async () => {
		equal(parseFramerate('test'), NaN);
		equal(parseFramerate('30/0'), NaN);
	});
});
