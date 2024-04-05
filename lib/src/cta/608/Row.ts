/**
 *
 * This code was ported from the dash.js project at:
 *   https://github.com/Dash-Industry-Forum/dash.js/blob/development/externals/cea608-parser.js
 *   https://github.com/Dash-Industry-Forum/dash.js/commit/8269b26a761e0853bb21d78780ed945144ecdd4d#diff-71bc295a2d6b6b7093a1d3290d53a4b2
 *
 * The original copyright appears below:
 *
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2015-2016, DASH Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  1. Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  2. Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

import { CaptionsLogger } from './CaptionsLogger.js';
import { PenState } from './PenState.js';
import { PenStyles } from './PenStyles.js';
import { StyledUnicodeChar } from './StyledUnicodeChar.js';
import { NR_COLS } from './utils/NR_COLS.js';
import { VerboseLevel } from './utils/VerboseLevel.js';
import { getCharForByte } from './utils/getCharForByte.js';

/**
 * CEA-608 row consisting of NR_COLS instances of StyledUnicodeChar.
 * @constructor
 */
export class Row {
	public chars: StyledUnicodeChar[] = [];
	private pos: number = 0;
	private currPenState: PenState = new PenState();
	public cueStartTime: number | null = null;
	private logger: CaptionsLogger;

	constructor(logger: CaptionsLogger) {
		for (let i = 0; i < NR_COLS; i++) {
			this.chars.push(new StyledUnicodeChar());
		}
		this.logger = logger;
	}

	equals(other: Row): boolean {
		for (let i = 0; i < NR_COLS; i++) {
			if (!this.chars[i].equals(other.chars[i])) {
				return false;
			}
		}
		return true;
	}

	copy(other: Row): void {
		for (let i = 0; i < NR_COLS; i++) {
			this.chars[i].copy(other.chars[i]);
		}
	}

	isEmpty(): boolean {
		let empty = true;
		for (let i = 0; i < NR_COLS; i++) {
			if (!this.chars[i].isEmpty()) {
				empty = false;
				break;
			}
		}
		return empty;
	}

	/**
	 *  Set the cursor to a valid column.
	 */
	setCursor(absPos: number): void {
		if (this.pos !== absPos) {
			this.pos = absPos;
		}

		if (this.pos < 0) {
			this.logger.log(
				VerboseLevel.DEBUG,
				'Negative cursor position ' + this.pos,
			);
			this.pos = 0;
		}
		else if (this.pos > NR_COLS) {
			this.logger.log(
				VerboseLevel.DEBUG,
				'Too large cursor position ' + this.pos,
			);
			this.pos = NR_COLS;
		}
	}

	/**
	 * Move the cursor relative to current position.
	 */
	moveCursor(relPos: number): void {
		const newPos = this.pos + relPos;
		if (relPos > 1) {
			for (let i = this.pos + 1; i < newPos + 1; i++) {
				this.chars[i].setPenState(this.currPenState);
			}
		}
		this.setCursor(newPos);
	}

	/**
	 * Backspace, move one step back and clear character.
	 */
	backSpace(): void {
		this.moveCursor(-1);
		this.chars[this.pos].setChar(' ', this.currPenState);
	}

	insertChar(byte: number): void {
		if (byte >= 0x90) {
			// Extended char
			this.backSpace();
		}
		const char = getCharForByte(byte);
		if (this.pos >= NR_COLS) {
			this.logger.log(
				VerboseLevel.ERROR,
				() =>
					'Cannot insert ' +
					byte.toString(16) +
					' (' +
					char +
					') at position ' +
					this.pos +
					'. Skipping it!',
			);
			return;
		}
		this.chars[this.pos].setChar(char, this.currPenState);
		this.moveCursor(1);
	}

	clearFromPos(startPos: number): void {
		let i: number;
		for (i = startPos; i < NR_COLS; i++) {
			this.chars[i].reset();
		}
	}

	clear(): void {
		this.clearFromPos(0);
		this.pos = 0;
		this.currPenState.reset();
	}

	clearToEndOfRow(): void {
		this.clearFromPos(this.pos);
	}

	getTextString(): string {
		const chars: string[] = [];
		let empty = true;
		for (let i = 0; i < NR_COLS; i++) {
			const char = this.chars[i].uchar;
			if (char !== ' ') {
				empty = false;
			}

			chars.push(char);
		}
		if (empty) {
			return '';
		}
		else {
			return chars.join('');
		}
	}

	setPenStyles(styles: Partial<PenStyles>): void {
		this.currPenState.setStyles(styles);
		const currChar = this.chars[this.pos];
		currChar.setPenState(this.currPenState);
	}
}
