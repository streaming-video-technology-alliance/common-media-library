import { equal } from 'node:assert';
import { describe, it } from 'node:test';

import { iso8601DurationToNumber } from '@svta/common-media-library/cmaf/ham/utils/dash/iso8601DurationToNumber.ts';
import { numberToIso8601Duration } from '@svta/common-media-library/cmaf/ham/utils/dash/numberToIso8601Duration.ts';

describe('iso8601DurationToNumber', () => {
	it('converts PT5S to 5', () => {
		const res = iso8601DurationToNumber('PT5S');
		equal(res, 5);
	});

	it('converts PT1M5S to 65', () => {
		const res = iso8601DurationToNumber('PT1M5S');
		equal(res, 65);
	});

	it('converts PT7M24S to 444', () => {
		const res = iso8601DurationToNumber('PT7M24S');
		equal(res, 444);
	});
});

describe('numberToIso8601Duration', () => {
	it('converts 5 to PT5S', () => {
		const res = numberToIso8601Duration(5);
		equal(res, 'PT5S');
	});

	it('converts 65 to PT1M5S', () => {
		const res = numberToIso8601Duration(65);
		equal(res, 'PT1M5S');
	});

	it('converts 444 to PT7M24S', () => {
		const res = numberToIso8601Duration(444);
		equal(res, 'PT7M24S');
	});
});
