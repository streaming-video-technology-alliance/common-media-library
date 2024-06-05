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
import { Channels } from './Channels.js';
import type { CmdHistory } from './CmdHistory.js';
import { Cta608Channel } from './Cta608Channel.js';
import { PACData } from './PACData.js';
import { PenStyles } from './PenStyles.js';
import { SupportedField } from './SupportedField.js';
import { VerboseLevel } from './utils/VerboseLevel.js';
import { backgroundColors } from './utils/backgroundColors.js';
import { createCmdHistory } from './utils/createCmdHistory.js';
import { getCharForByte } from './utils/getCharForByte.js';
import { hasCmdRepeated } from './utils/hasCmdRepeated.js';
import { numArrayToHexArray } from './utils/numArrayToHexArray.js';
import { rowsHighCh1 } from './utils/rowsHighCh1.js';
import { rowsHighCh2 } from './utils/rowsHighCh2.js';
import { rowsLowCh1 } from './utils/rowsLowCh1.js';
import { rowsLowCh2 } from './utils/rowsLowCh2.js';
import { setLastCmd } from './utils/setLastCmd.js';

/**
 * CEA-608 caption parser.
 *
 * @group CTA-608
 * @beta
 */
export class Cta608Parser {
	private channels: Array<Cta608Channel | null>;
	private currentChannel: Channels = 0;
	private cmdHistory: CmdHistory = createCmdHistory();
	private logger: CaptionsLogger;
	private lastTime: number | null = null;

	constructor(field: SupportedField, out1: any, out2: any) {
		const logger = (this.logger = new CaptionsLogger());
		this.channels = [
			null,
			new Cta608Channel(field, out1, logger),
			new Cta608Channel(field + 1, out2, logger),
		];
	}

	/**
	 * Add data for time t in forms of list of bytes (unsigned ints). The bytes are treated as pairs.
	 *
	 * @param time - The time in milliseconds
	 * @param byteList - The list of bytes
	 */
	addData(time: number | null, byteList: number[]): void {
		this.lastTime = time;
		this.logger.time = time;

		for (let i = 0; i < byteList.length; i += 2) {
			const a = byteList[i] & 0x7f;
			const b = byteList[i + 1] & 0x7f;
			let cmdFound: boolean = false;
			let charsFound: number[] | null = null;

			if (this.lastTime !== null) {
				time = this.lastTime + 0.5 * i * 1001 / 30000;
				this.logger.time = time;
			}

			if (a === 0 && b === 0) {
				continue;
			}
			else {
				this.logger.log(
					VerboseLevel.DATA,
					() =>
						'[' +
						numArrayToHexArray([byteList[i], byteList[i + 1]]) +
						'] -> (' +
						numArrayToHexArray([a, b]) +
						')',
				);
			}

			const cmdHistory = this.cmdHistory;
			const isControlCode = a >= 0x10 && a <= 0x1f;
			if (isControlCode) {
				// Skip redundant control codes
				if (hasCmdRepeated(a, b, cmdHistory)) {
					setLastCmd(null, null, cmdHistory);
					this.logger.log(
						VerboseLevel.DEBUG,
						() =>
							'Repeated command (' +
							numArrayToHexArray([a, b]) +
							') is dropped',
					);
					continue;
				}
				setLastCmd(a, b, this.cmdHistory);

				cmdFound = this.parseCmd(a, b);

				if (!cmdFound) {
					cmdFound = this.parseMidrow(a, b);
				}

				if (!cmdFound) {
					cmdFound = this.parsePAC(a, b);
				}

				if (!cmdFound) {
					cmdFound = this.parseBackgroundAttributes(a, b);
				}
			}
			else {
				setLastCmd(null, null, cmdHistory);
			}

			if (!cmdFound) {
				charsFound = this.parseChars(a, b);
				if (charsFound.length) {
					const currChNr = this.currentChannel;
					if (currChNr && currChNr > 0) {
						const channel = this.channels[currChNr] as Cta608Channel;
						channel.insertChars(charsFound);
					}
					else {
						this.logger.log(
							VerboseLevel.WARNING,
							'No channel found yet. TEXT-MODE?',
						);
					}
				}
			}
			if (!cmdFound && !charsFound) {
				this.logger.log(
					VerboseLevel.WARNING,
					() =>
						"Couldn't parse cleaned data " +
						numArrayToHexArray([a, b]) +
						' orig: ' +
						numArrayToHexArray([byteList[i], byteList[i + 1]]),
				);
			}
		}
	}

	/**
	 * Parse Command.
	 *
	 * @param a - The first byte
	 * @param b - The second byte
	 * @returns True if a command was found
	 */
	private parseCmd(a: number, b: number): boolean {
		
		const cond1 =
			(a === 0x14 || a === 0x1c || a === 0x15 || a === 0x1d) &&
			b >= 0x20 &&
			b <= 0x2f;
		const cond2 = (a === 0x17 || a === 0x1f) && b >= 0x21 && b <= 0x23;
		if (!(cond1 || cond2)) {
			return false;
		}

		const chNr = a === 0x14 || a === 0x15 || a === 0x17 ? 1 : 2;
		const channel = this.channels[chNr] as Cta608Channel;

		if (a === 0x14 || a === 0x15 || a === 0x1c || a === 0x1d) {
			if (b === 0x20) {
				channel.ccRCL();
			}
			else if (b === 0x21) {
				channel.ccBS();
			}
			else if (b === 0x22) {
				channel.ccAOF();
			}
			else if (b === 0x23) {
				channel.ccAON();
			}
			else if (b === 0x24) {
				channel.ccDER();
			}
			else if (b === 0x25) {
				channel.ccRU(2);
			}
			else if (b === 0x26) {
				channel.ccRU(3);
			}
			else if (b === 0x27) {
				channel.ccRU(4);
			}
			else if (b === 0x28) {
				channel.ccFON();
			}
			else if (b === 0x29) {
				channel.ccRDC();
			}
			else if (b === 0x2a) {
				channel.ccTR();
			}
			else if (b === 0x2b) {
				channel.ccRTD();
			}
			else if (b === 0x2c) {
				channel.ccEDM();
			}
			else if (b === 0x2d) {
				channel.ccCR();
			}
			else if (b === 0x2e) {
				channel.ccENM();
			}
			else if (b === 0x2f) {
				channel.ccEOC();
			}
		}
		else {
			// a == 0x17 || a == 0x1F
			channel.ccTO(b - 0x20);
		}
		
		this.currentChannel = chNr;
		return true;
	}

	/**
	 * Parse midrow styling command
	 *
	 * @param a - The first byte
	 * @param b - The second byte
	 * @returns `true` if midrow styling command was found
	 */
	private parseMidrow(a: number, b: number): boolean {
		let chNr: number = 0;

		if ((a === 0x11 || a === 0x19) && b >= 0x20 && b <= 0x2f) {
			if (a === 0x11) {
				chNr = 1;
			}
			else {
				chNr = 2;
			}

			if (chNr !== this.currentChannel) {
				this.logger.log(
					VerboseLevel.ERROR,
					'Mismatch channel in midrow parsing',
				);
				return false;
			}
			const channel = this.channels[chNr];
			if (!channel) {
				return false;
			}
			channel.ccMIDROW(b);
			this.logger.log(
				VerboseLevel.DEBUG,
				() => 'MIDROW (' + numArrayToHexArray([a, b]) + ')',
			);
			return true;
		}
		return false;
	}

	/**
	 * Parse Preable Access Codes (Table 53).
	 *
	 * @param a - The first byte
	 * @param b - The second byte
	 * @returns A Boolean that tells if PAC found
	 */
	private parsePAC(a: number, b: number): boolean {
		let row: number;

		const case1 =
			((a >= 0x11 && a <= 0x17) || (a >= 0x19 && a <= 0x1f)) &&
			b >= 0x40 &&
			b <= 0x7f;
		const case2 = (a === 0x10 || a === 0x18) && b >= 0x40 && b <= 0x5f;
		if (!(case1 || case2)) {
			return false;
		}

		const chNr: Channels = a <= 0x17 ? 1 : 2;

		if (b >= 0x40 && b <= 0x5f) {
			row = chNr === 1 ? rowsLowCh1[a] : rowsLowCh2[a];
		}
		else {
			// 0x60 <= b <= 0x7F
			row = chNr === 1 ? rowsHighCh1[a] : rowsHighCh2[a];
		}
		const channel = this.channels[chNr];
		if (!channel) {
			return false;
		}
		channel.setPAC(this.interpretPAC(row, b));
		this.currentChannel = chNr;
		return true;
	}

	/**
	 * Interpret the second byte of the pac, and return the information.
	 *
	 * @param row - The row number
	 * @param byte - The second byte
	 * @returns pacData with style parameters
	 */
	private interpretPAC(row: number, byte: number): PACData {
		let pacIndex;
		const pacData: PACData = {
			color: null,
			italics: false,
			indent: null,
			underline: false,
			row: row,
		};

		if (byte > 0x5f) {
			pacIndex = byte - 0x60;
		}
		else {
			pacIndex = byte - 0x40;
		}

		pacData.underline = (pacIndex & 1) === 1;
		if (pacIndex <= 0xd) {
			pacData.color = [
				'white',
				'green',
				'blue',
				'cyan',
				'red',
				'yellow',
				'magenta',
				'white',
			][Math.floor(pacIndex / 2)];
		}
		else if (pacIndex <= 0xf) {
			pacData.italics = true;
			pacData.color = 'white';
		}
		else {
			pacData.indent = Math.floor((pacIndex - 0x10) / 2) * 4;
		}
		return pacData; // Note that row has zero offset. The spec uses 1.
	}

	/**
	 * Parse characters.
	 *
	 * @param a - The first byte
	 * @param b - The second byte
	 * @returns An array with 1 to 2 codes corresponding to chars, if found. null otherwise.
	 */
	private parseChars(a: number, b: number): number[] {
		let channelNr: Channels;
		let charCodes: number[] = [];
		let charCode1: number | null = null;

		if (a >= 0x19) {
			channelNr = 2;
			charCode1 = a - 8;
		}
		else {
			channelNr = 1;
			charCode1 = a;
		}
		if (charCode1 >= 0x11 && charCode1 <= 0x13) {
			// Special character
			let oneCode: number;
			if (charCode1 === 0x11) {
				oneCode = b + 0x50;
			}
			else if (charCode1 === 0x12) {
				oneCode = b + 0x70;
			}
			else {
				oneCode = b + 0x90;
			}

			this.logger.log(
				VerboseLevel.INFO,
				() =>
					"Special char '" +
					getCharForByte(oneCode) +
					"' in channel " +
					channelNr,
			);
			charCodes = [oneCode];
		}
		else if (a >= 0x20 && a <= 0x7f) {
			charCodes = b === 0 ? [a] : [a, b];
		}
		if (charCodes) {
			this.logger.log(
				VerboseLevel.DEBUG,
				() => 'Char codes =  ' + numArrayToHexArray(charCodes).join(','),
			);
		}
		return charCodes;
	}

	/**
	 * Parse extended background attributes as well as new foreground color black.
	 *
	 * @param a - The first byte
	 * @param b - The second byte
	 * @returns True if background attributes are found
	 */
	private parseBackgroundAttributes(a: number, b: number): boolean {
		const case1 = (a === 0x10 || a === 0x18) && b >= 0x20 && b <= 0x2f;
		const case2 = (a === 0x17 || a === 0x1f) && b >= 0x2d && b <= 0x2f;
		if (!(case1 || case2)) {
			return false;
		}
		let index: number;
		const bkgData: Partial<PenStyles> = {};
		if (a === 0x10 || a === 0x18) {
			index = Math.floor((b - 0x20) / 2);
			bkgData.background = backgroundColors[index];
			if (b % 2 === 1) {
				bkgData.background = bkgData.background + '_semi';
			}
		}
		else if (b === 0x2d) {
			bkgData.background = 'transparent';
		}
		else {
			bkgData.foreground = 'black';
			if (b === 0x2f) {
				bkgData.underline = true;
			}
		}
		const chNr: Channels = a <= 0x17 ? 1 : 2;
		const channel: Cta608Channel = this.channels[chNr] as Cta608Channel;
		channel.setBkgData(bkgData);
		return true;
	}

	/**
	 * Reset state of parser and its channels.
	 */
	reset(): void {
		for (let i = 0; i < Object.keys(this.channels).length; i++) {
			const channel = this.channels[i];
			if (channel) {
				channel.reset();
			}
		}
		setLastCmd(null, null, this.cmdHistory);
	}

	/**
	 * Trigger the generation of a cue, and the start of a new one if displayScreens are not empty.
	 */
	cueSplitAtTime(t: number): void {
		for (let i = 0; i < this.channels.length; i++) {
			const channel = this.channels[i];
			if (channel) {
				channel.cueSplitAtTime(t);
			}
		}
	}
}
