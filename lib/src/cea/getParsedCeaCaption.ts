/**
 * Emits a closed caption based on the state of the buffer.
 * @param {!shaka.text.Cue} topLevelCue
 * @param {string} stream
 * @param {!Array<!Array<?shaka.cea.CeaUtils.StyledChar>>} memory
 * @param {number} startTime Start time of the cue.
 * @param {number} endTime End time of the cue.
 * @return {?shaka.extern.ICaptionDecoder.ClosedCaption}
 */
export function getParsedCaption(topLevelCue: Cue, stream, memory, startTime, endTime) {
	if (startTime >= endTime) {
		return null;
	}

	// Find the first and last row that contains characters.
	let firstNonEmptyRow = -1;
	let lastNonEmptyRow = -1;

	for (let i = 0; i < memory.length; i++) {
		if (memory[i].some((e) => e != null && e.getChar().trim() != '')) {
			firstNonEmptyRow = i;
			break;
		}
	}

	for (let i = memory.length - 1; i >= 0; i--) {
		if (memory[i].some((e) => e != null && e.getChar().trim() != '')) {
			lastNonEmptyRow = i;
			break;
		}
	}

	// Exit early if no non-empty row was found.
	if (firstNonEmptyRow === -1 || lastNonEmptyRow === -1) {
		return null;
	}

	// Keeps track of the current styles for a cue being emitted.
	let currentUnderline = false;
	let currentItalics = false;
	let currentTextColor = shaka.cea.CeaUtils.DEFAULT_TXT_COLOR;
	let currentBackgroundColor = shaka.cea.CeaUtils.DEFAULT_BG_COLOR;

	// Create first cue that will be nested in top level cue. Default styles.
	let currentCue = shaka.cea.CeaUtils.createStyledCue(
		startTime, endTime, currentUnderline, currentItalics,
		currentTextColor, currentBackgroundColor);

	// Logic: Reduce rows into a single top level cue containing nested cues.
	// Each nested cue corresponds either a style change or a line break.

	for (let i = firstNonEmptyRow; i <= lastNonEmptyRow; i++) {
		// Find the first and last non-empty characters in this row. We do this so
		// no styles creep in before/after the first and last non-empty chars.
		const row = memory[i];
		let firstNonEmptyCol = -1;
		let lastNonEmptyCol = -1;

		for (let j = 0; j < row.length; j++) {
			if (row[j] != null && row[j].getChar().trim() !== '') {
				firstNonEmptyCol = j;
				break;
			}
		}

		for (let j = row.length - 1; j >= 0; j--) {
			if (row[j] != null && row[j].getChar().trim() !== '') {
				lastNonEmptyCol = j;
				break;
			}
		}

		// If no non-empty char. was found in this row, it must be a linebreak.
		if (firstNonEmptyCol === -1 || lastNonEmptyCol === -1) {
			const linebreakCue = shaka.cea.CeaUtils
				.createLineBreakCue(startTime, endTime);
			topLevelCue.nestedCues.push(linebreakCue);
			continue;
		}

		for (let j = firstNonEmptyCol; j <= lastNonEmptyCol; j++) {
			const styledChar = row[j];

			// A null between non-empty cells in a row is handled as a space.
			if (!styledChar) {
				currentCue.payload += ' ';
				continue;
			}
			const underline = styledChar.isUnderlined();
			const italics = styledChar.isItalicized();
			const textColor = styledChar.getTextColor();
			const backgroundColor = styledChar.getBackgroundColor();

			// If any style properties have changed, we need to open a new cue.
			if (underline != currentUnderline || italics != currentItalics ||
				textColor != currentTextColor ||
				backgroundColor != currentBackgroundColor) {
				// Push the currently built cue and start a new cue, with new styles.
				if (currentCue.payload) {
					topLevelCue.nestedCues.push(currentCue);
				}
				currentCue = shaka.cea.CeaUtils.createStyledCue(
					startTime, endTime, underline,
					italics, textColor, backgroundColor);

				currentUnderline = underline;
				currentItalics = italics;
				currentTextColor = textColor;
				currentBackgroundColor = backgroundColor;
			}

			currentCue.payload += styledChar.getChar();
		}
		if (currentCue.payload) {
			topLevelCue.nestedCues.push(currentCue);
		}

		// Add a linebreak since the row just ended.
		if (i !== lastNonEmptyRow) {
			const linebreakCue = shaka.cea.CeaUtils
				.createLineBreakCue(startTime, endTime);
			topLevelCue.nestedCues.push(linebreakCue);
		}

		// Create a new cue.
		currentCue = shaka.cea.CeaUtils.createStyledCue(
			startTime, endTime, currentUnderline, currentItalics,
			currentTextColor, currentBackgroundColor);
	}

	if (topLevelCue.nestedCues.length) {
		return {
			cue: topLevelCue,
			stream,
		};
	}

	return null;
}
