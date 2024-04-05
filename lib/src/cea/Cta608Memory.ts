import { BasicNorthAmericanChars } from './BasicNorthAmericanChars.js';
import { CC_ROWS } from './CC_ROWS.js';
import { CharSet } from './CharSet.js';
import type { Cue } from './Cue.js';
import { DEFAULT_BG_COLOR } from './DEFAULT_BG_COLOR.js';
import { DEFAULT_TXT_COLOR } from './DEFAULT_TXT_COLOR.js';
import { ExtendedPortugueseGerman } from './ExtendedPortugueseGerman.js';
import { ExtendedSpanishFrench } from './ExtendedSpanishFrench';
import { ROW_TO_LINE_CONVERSION } from './ROW_TO_LINE_CONVERSION.js';
import { SpecialNorthAmericanChars } from './SpecialNorthAmericanChars.js';
import { StyledChar } from './StyledChar.js';

/**
 * CTA-608 captions memory/buffer.
 */
export class Cea608Memory {

	/**
	 * Buffer for storing decoded characters.
	 */
	private rows_: StyledChar[][] = [];

	/**
	 * Current row.
	 */
	private row_: number = 1;

	/**
	 * Number of rows in the scroll window. Used for rollup mode.
	 */
	private scrollRows_: number = 0;

	/**
	 * Field number.
	 */
	private fieldNum_: number;

	/**
	 * Channel number.
	 */
	private channelNum_: number;

	/**
	 */
	private underline_: boolean = false;

	/**
	 */
	private italics_: boolean = false;

	/**
	 */
	private textColor_: string = DEFAULT_TXT_COLOR;

	/**
	 */
	private backgroundColor_: string = DEFAULT_BG_COLOR;

	/**
	 * @param fieldNum - Field number.
	 * @param channelNum - Channel number.
	 */
	constructor(fieldNum: number, channelNum: number) {
		this.fieldNum_ = fieldNum;
		this.channelNum_ = channelNum;

		this.reset();
	}

	/**
	 * Emits a closed caption based on the state of the buffer.
	 * @param startTime - Start time of the cue.
	 * @param endTime - End time of the cue.
	 * @return {?shaka.extern.ICaptionDecoder.ClosedCaption}
	 */
	forceEmit(startTime: number, endTime: number) {
		const stream = `CC${((this.fieldNum_ << 1) | this.channelNum_) + 1}`;
		const topLevelCue: Cue = { startTime, endTime };
		topLevelCue.lineInterpretation =
			shaka.text.Cue.lineInterpretation.PERCENTAGE;
		const line = ROW_TO_LINE_CONVERSION.get(this.row_);
		if (line) {
			topLevelCue.line = line;
		}
		return shaka.cea.CeaUtils.getParsedCaption(
			topLevelCue, stream, this.rows_, startTime, endTime);
	}

	/**
	 * Resets the memory buffer.
	 */
	reset(): void {
		this.resetAllRows();
		this.row_ = 1;
	}

	/**
	 */
	getRow(): number {
		return this.row_;
	}

	/**
	 */
	setRow(row: number): void {
		this.row_ = row;
	}

	/**
	 */
	getScrollSize(): number {
		return this.scrollRows_;
	}

	/**
	 */
	setScrollSize(scrollRows: number): void {
		this.scrollRows_ = scrollRows;
	}

	/**
	 * Adds a character to the buffer.
	 * @param set - Character set.
	 * @param b - CC byte to add.
	 */
	addChar(set: CharSet, b: number) {
		// Valid chars are in the range [0x20, 0x7f]
		if (b < 0x20 || b > 0x7f) {
			return;
		}

		let char: string | undefined = '';

		switch (set) {
			case CharSet.BASIC_NORTH_AMERICAN:
				if (BasicNorthAmericanChars.has(b)) {
					char = BasicNorthAmericanChars.get(b);
				}
				else {
					// Regular ASCII
					char = String.fromCharCode(b);
				}
				break;
			case CharSet.SPECIAL_NORTH_AMERICAN:
				char = SpecialNorthAmericanChars.get(b);
				break;
			case CharSet.SPANISH_FRENCH:
				// Extended charset does a BS over preceding char, 6.4.2 EIA-608-B.
				this.eraseChar();
				char = ExtendedSpanishFrench.get(b);
				break;
			case CharSet.PORTUGUESE_GERMAN:
				this.eraseChar();
				char = ExtendedPortugueseGerman.get(b);
				break;
		}

		if (char) {
			const styledChar = new StyledChar(
				char, this.underline_, this.italics_,
				this.backgroundColor_, this.textColor_);
			this.rows_[this.row_].push(styledChar);
		}
	}

	/**
	 * Erases a character from the buffer.
	 */
	eraseChar(): void {
		this.rows_[this.row_].pop();
	}

	/**
	 * Moves rows of characters.
	 *
	 * @param dst - Destination row index.
	 * @param src - Source row index.
	 * @param count - Count of rows to move.
	 */
	moveRows(dst: number, src: number, count: number): void {
		if (src < 0 || dst < 0) {
			return;
		}

		if (dst >= src) {
			for (let i = count - 1; i >= 0; i--) {
				this.rows_[dst + i] = this.rows_[src + i].map((e) => e);
			}
		}
		else {
			for (let i = 0; i < count; i++) {
				this.rows_[dst + i] = this.rows_[src + i].map((e) => e);
			}
		}
	}

	/**
	 * Resets rows of characters.
	 *
	 * @param idx - Starting index.
	 * @param count - Count of rows to reset.
	 */
	resetRows(idx: number, count: number): void {
		for (let i = 0; i <= count; i++) {
			this.rows_[idx + i] = [];
		}
	}

	/**
	 * Resets the entire memory buffer.
	 */
	resetAllRows(): void {
		this.resetRows(0, CC_ROWS);
	}

	/**
	 * Erases entire memory buffer.
	 * Doesn't change scroll state or number of rows.
	 */
	eraseBuffer(): void {
		this.row_ = (this.scrollRows_ > 0) ? this.scrollRows_ : 0;
		this.resetAllRows();
	}

	/**
	 */
	setUnderline(underline: boolean): void {
		this.underline_ = underline;
	}

	/**
	 */
	setItalics(italics: boolean): void {
		this.italics_ = italics;
	}

	/**
	 */
	setTextColor(color: string): void {
		this.textColor_ = color;
	}

	/**
	 */
	setBackgroundColor(color: string): void {
		this.backgroundColor_ = color;
	}
}
