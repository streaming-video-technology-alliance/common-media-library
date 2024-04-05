/*! @license
 * Shaka Player
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

goog.provide('shaka.cea.CeaUtils');
goog.provide('shaka.cea.CeaUtils.StyledChar');

goog.require('shaka.text.Cue');


shaka.cea.CeaUtils = class {


	/**
	 * @param {number} startTime
	 * @param {number} endTime
	 * @param {boolean} underline
	 * @param {boolean} italics
	 * @param {string} txtColor
	 * @param {string} bgColor
	 * @return {!shaka.text.Cue}
	 */
	static createStyledCue(startTime, endTime, underline,
		italics, txtColor, bgColor) {
		const cue = new shaka.text.Cue(startTime, endTime, /* payload= */ '');
		if (underline) {
			cue.textDecoration.push(shaka.text.Cue.textDecoration.UNDERLINE);
		}
		if (italics) {
			cue.fontStyle = shaka.text.Cue.fontStyle.ITALIC;
		}
		cue.color = txtColor;
		cue.backgroundColor = bgColor;
		return cue;
	}

	/**
	 * @param {number} startTime
	 * @param {number} endTime
	 * @return {!shaka.text.Cue}
	 */
	static createLineBreakCue(startTime, endTime) {
		const linebreakCue = new shaka.text.Cue(
			startTime, endTime, /* payload= */ '');
		linebreakCue.lineBreak = true;
		return linebreakCue;
	}
};






/**
 * NALU type for Supplemental Enhancement Information (SEI) for H.264.
 * @const {number}
 */
shaka.cea.CeaUtils.H264_NALU_TYPE_SEI = 0x06;

/**
 * NALU type for Supplemental Enhancement Information (SEI) for H.265.
 * @const {number}
 */
shaka.cea.CeaUtils.H265_PREFIX_NALU_TYPE_SEI = 0x27;

/**
 * NALU type for Supplemental Enhancement Information (SEI) for H.265.
 * @const {number}
 */
shaka.cea.CeaUtils.H265_SUFFIX_NALU_TYPE_SEI = 0x28;

/**
 * Default timescale value for a track.
 * @const {number}
 */
shaka.cea.CeaUtils.DEFAULT_TIMESCALE_VALUE = 90000;
