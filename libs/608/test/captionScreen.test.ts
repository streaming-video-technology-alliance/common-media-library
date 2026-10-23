import { CaptionScreen, Row } from '@svta/cml-608'
import { deepEqual, equal } from 'node:assert'
import { beforeEach, describe, it, vi } from 'vite-plus/test'

describe('CaptionScreen Tests', () => {
	const NR_ROWS = 15

	let captionScreen: CaptionScreen

	beforeEach(() => {
		captionScreen = new CaptionScreen()
	})

	it('Create CaptionScreen correctly', () => {
		equal(captionScreen.rows.length, NR_ROWS)
		for (let i = 0; i < NR_ROWS; i++) {
			deepEqual(captionScreen.rows[i], new Row())
		}
	})

	it('getDisplayText correctly', () => {
		const myText = 'This is a test'
		const expectedText = "[Row 1: 'This is a test']"
		vi.spyOn(captionScreen.rows[0], 'getTextString').mockImplementation(() => myText)
		equal(captionScreen.getDisplayText(true), expectedText)
	})
})
