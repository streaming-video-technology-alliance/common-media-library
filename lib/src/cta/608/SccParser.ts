/**
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
function SccParser(processor: any, field: number | any = 1) {
	let hasHeader = false;
	let nrLinesParsed = 0;

	function parse(lines: string[]): void {
		nrLinesParsed = 0;

		if (lines[0] === 'Scenarist_SCC V1.0') {
			hasHeader = true;
			nrLinesParsed++;
		}

		for (let l = 1; l < lines.length; l += 2) {
			if (lines[l] !== '') {
				break;  // Every second line should be empty
			}
			nrLinesParsed++;
			const lineData = parseDataLine(lines[l + 1]);
			if (lineData === null) {
				break;
			}
			nrLinesParsed++;
			processor.addData(lineData[0], lineData[1]);
		}
	}

	function parseDataLine(line: string): [number, number[]] | null {
		if (!line) {
			return null;
		}

		const lineParts = line.split(/\s+/);
		const timeData = lineParts[0];
		const ceaData: number[] = [];

		for (let i = 1; i < lineParts.length; i++) {
			const fourHexChars = lineParts[i];
			const a = parseInt(fourHexChars.substring(0, 2), 16);
			const b = parseInt(fourHexChars.substring(2, 4), 16);
			ceaData.push(a, b);
		}

		const time = timeConverter(timeData);
		return [time, ceaData];
	}

	function timeConverter(smpteTs: string): number {
		const parts = smpteTs.split(':');
		if (parts.length === 3) {
			const lastParts = parts[2].split(';');
			parts[2] = lastParts[0];
			const frames = parseInt(lastParts[1], 10);
			return (30 * (60 * (60 * parseInt(parts[0], 10) + parseInt(parts[1], 10)) + parseInt(parts[2], 10)) + frames) * 1001 / 30000;
		}
		return 0;  // in case if format is incorrect
	}

	function getHeaderStatus() {
		return hasHeader;
	}

	function getField() {
		return field;
	}

	function getLinesParsed() {
		return nrLinesParsed;
	}
    
	return {
		parse,
		getHeaderStatus,
		getField,
		getLinesParsed,
	};
}

export { SccParser };
