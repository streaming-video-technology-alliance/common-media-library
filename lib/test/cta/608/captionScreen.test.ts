import { CaptionScreen, Row } from '@svta/common-media-library/608';
import { deepEqual, equal } from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

describe('CaptionScreen Tests', () => {
	const NR_ROWS = 15;

	let captionScreen: any;

	beforeEach(() => {
		captionScreen = new CaptionScreen();
	});

	it('Create CaptionScreen correctly', () => {
		equal(captionScreen.rows.length, NR_ROWS);
		for (let i = 0; i < NR_ROWS; i++) {
			deepEqual(captionScreen.rows[i], new Row());
		}
	});

	it('getDisplayText correctly', () => {
		const myText = 'This is a test';
		const expectedText = "[Row 1: 'This is a test']";
		mock.method(captionScreen.rows[0], 'getTextString', () => myText);
		equal(captionScreen.getDisplayText(true), expectedText);
	});

});
