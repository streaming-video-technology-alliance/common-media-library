import { CaptionScreen, CaptionsLogger, Row } from '@svta/common-media-library';
import { deepEqual, equal } from 'node:assert';
import { describe, it, beforeEach, mock } from 'node:test';

describe('CaptionScreen Tests', () => {
	const NR_ROWS = 15;
	const captionsLogger = new CaptionsLogger();
	let captionScreen: CaptionScreen;

	beforeEach(() => {
		captionScreen = new CaptionScreen(captionsLogger);
	});

	it('Create CaptionScreen correctly', () => {
		equal(captionScreen.rows.length, NR_ROWS);
		for (let i = 0; i < NR_ROWS; i++) {
			deepEqual(captionScreen.rows[i], new Row(captionsLogger));
		}
		deepEqual(captionScreen.logger, captionsLogger);
	});

	it('getDisplayText correctly', () => {
		const myText = 'This is a test';
		const expectedText = "[Row 1: 'This is a test']";
		mock.method(captionScreen.rows[0], 'getTextString', () => myText);
		equal(captionScreen.getDisplayText(true), expectedText);
	});

});
