/*! @license
 * Shaka Player
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CueDirection } from './CueDirection';
import { CueDisplayAlign } from './CueDisplayAlign';
import { CueFontStyle } from './CueFontStyle';
import { CueFontWeight } from './CueFontWeight';
import { CueLineAlign } from './CueLineAlign';
import { CueLineInterpretation } from './CueLineInterpretation';
import { CuePositionAlign } from './CuePositionAlign';
import { CueRegion } from './CueRegion';
import { CueTextAlign } from './CueTextAlign';
import type { CueTextDecoration } from './CueTextDecoration';
import { CueWritingMode } from './CueWritingMode';

goog.provide('shaka.text.Cue');
goog.provide('shaka.text.CueRegion');

goog.require('shaka.util.ArrayUtils');


/**
 * Cue
 */
export class Cue {
	/**
	 * The start time of the cue in seconds, relative to the start of the
	 * presentation.
	 */
	startTime: number;

	/**
	 * The end time of the cue in seconds, relative to the start of the
	 * presentation.
	 */
	endTime: number;

	/**
	 * The text payload of the cue.  If nestedCues is non-empty, this should be
	 * empty.  Top-level block containers should have no payload of their own.
	 */
	payload: string;

	/**
	 * The region to render the cue into.  Only supported on top-level cues,
	 * because nested cues are inline elements.
	 */
	region: CueRegion = new CueRegion();

	/**
	 * The indent (in percent) of the cue box in the direction defined by the
	 * writing direction.
	 */
	position: number | null = null;

	/**
	 * Position alignment of the cue.
	 */
	positionAlign = CuePositionAlign.AUTO;

	/**
	 * Size of the cue box (in percents), where 0 means "auto".
	 */
	size: number = 0;


	/**
	 * Alignment of the text inside the cue box.
	 */
	textAlign: CueTextAlign = CueTextAlign.CENTER;

	/**
	 * Text direction of the cue.
	 */
	direction: CueDirection = CueDirection.HORIZONTAL_LEFT_TO_RIGHT;

	/**
	 * Text writing mode of the cue.
	 */
	writingMode: CueWritingMode = CueWritingMode.HORIZONTAL_TOP_TO_BOTTOM;

	/**
	 * The way to interpret line field. (Either as an integer line number or
	 * percentage from the display box).
	 */
	lineInterpretation: CueLineInterpretation = CueLineInterpretation.LINE_NUMBER;

	/**
	 * The offset from the display box in either number of lines or
	 * percentage depending on the value of lineInterpretation.
	 */
	line: number | null = null;

	/**
	 * Separation between line areas inside the cue box in px or em
	 * (e.g. '100px'/'100em'). If not specified, this should be no less than
	 * the largest font size applied to the text in the cue.
	 */
	lineHeight: string = '';

	/**
	 * Line alignment of the cue box.
	 * Start alignment means the cue box’s top side (for horizontal cues), left
	 * side (for vertical growing right), or right side (for vertical growing
	 * left) is aligned at the line.
	 * Center alignment means the cue box is centered at the line.
	 * End alignment The cue box’s bottom side (for horizontal cues), right side
	 * (for vertical growing right), or left side (for vertical growing left) is
	 * aligned at the line.
	 */
	lineAlign: CueLineAlign = CueLineAlign.START;

	/**
	 * Vertical alignments of the cues within their extents.
	 * 'BEFORE' means displaying the captions at the top of the text display
	 * container box, 'CENTER' means in the middle, 'AFTER' means at the bottom.
	 */
	displayAlign: CueDisplayAlign = CueDisplayAlign.AFTER;

	/**
	 * Text color as a CSS color, e.g. "#FFFFFF" or "white".
	 */
	color: string = '';

	/**
	 * Text background color as a CSS color, e.g. "#FFFFFF" or "white".
	 */
	backgroundColor: string = '';

	/**
	 * The URL of the background image, e.g. "data:[mime type];base64,[data]".
	 */
	backgroundImage: string = '';

	/**
	 * The border around this cue as a CSS border.
	 */
	border: string = '';

	/**
	 * Text font size in px or em (e.g. '100px'/'100em').
	 */
	fontSize: string = '';

	/**
	 * Text font weight. Either normal or bold.
	 */
	fontWeight: CueFontWeight = CueFontWeight.NORMAL;

	/**
	 * Text font style. Normal, italic or oblique.
	 */
	fontStyle: CueFontStyle = CueFontStyle.NORMAL;

	/**
	 * Text font family.
	 */
	fontFamily: string = '';

	/**
	 * Text letter spacing as a CSS letter-spacing value.
	 */
	letterSpacing: string = '';

	/**
	 * Text line padding as a CSS line-padding value.
	 */
	linePadding: string = '';

	/**
	 * Opacity of the cue element, from 0-1.
	 */
	opacity: number = 1;

	/**
	 * Text combine upright as a CSS text-combine-upright value.
	 */
	textCombineUpright: string = '';

	/**
	 * Text decoration. A combination of underline, overline
	 * and line through. Empty array means no decoration.
	 */
	textDecoration: CueTextDecoration[] = [];

	/**
	 * Text shadow color as a CSS text-shadow value.
	 */
	textShadow: string = '';

	/**
	 * Text stroke color as a CSS color, e.g. "#FFFFFF" or "white".
	 */
	textStrokeColor: string = '';

	/**
	 * Text stroke width as a CSS stroke-width value.
	 */
	textStrokeWidth: string = '';

	/**
	 * Whether or not line wrapping should be applied to the cue.
	 */
	wrapLine: boolean = true;

	/**
	 * Id of the cue.
	 */
	id: string = '';

	/**
	 * Nested cues, which should be laid out horizontally in one block.
	 * Top-level cues are blocks, and nested cues are inline elements.
	 * Cues can be nested arbitrarily deeply.
	 */
	nestedCues: Cue[] = [];

	/**
	 * If true, this represents a container element that is "above" the main
	 * cues. For example, the <body> and <div> tags that contain the <p> tags
	 * in a TTML file. This controls the flow of the final cues; any nested cues
	 * within an "isContainer" cue will be laid out as separate lines.
	 */
	isContainer: boolean = false;

	/**
	 * Whether or not the cue only acts as a line break between two nested cues.
	 * Should only appear in nested cues.
	 */
	lineBreak: boolean = false;

	/**
	 * Used to indicate the type of ruby tag that should be used when rendering
	 * the cue. Valid values: ruby, rp, rt.
	 */
	rubyTag: string | null = null;

	/**
	 * The number of horizontal and vertical cells into which the Root Container
	 * Region area is divided.
	 */
	cellResolution: { columns: number, rows: number } = {
		columns: 32,
		rows: 15,
	};

	/**
	 * @param startTime - The start time of the cue in seconds
	 * @param endTime - The end time of the cue in seconds
	 * @param payload - The text payload of the cue
	 */
	constructor(startTime: number, endTime: number, payload: string = '') {
		this.startTime = startTime;
		this.endTime = endTime;
		this.payload = payload;
	}

	/**
	 * @param start - The start time of the cue in seconds
	 * @param end - The end time of the cue in seconds
	 * @returns The new cue
	 */
	static lineBreak(start: number, end: number): Cue {
		const cue = new Cue(start, end, '');
		cue.lineBreak = true;
		return cue;
	}

	/**
	 * Create a copy of the cue with the same properties.
	 *
	 * @returns The cloned cue
	 */
	clone() {
		const clone = new Cue(0, 0, '');

		for (const k in this) {
			let value = this[k] as any;

			// Make copies of array fields, but only one level deep.  That way, if we
			// change, for instance, textDecoration on the clone, we don't affect the
			// original.
			if (value && value.constructor == Array) {
				value = value.slice();
			}

			// @ts-ignore
			clone[k] = value;
		}

		return clone;
	}

	/**
	 * Check if two Cues have all the same values in all properties.
	 * @param cue1 - The first cue
	 * @param cue2 - The second cue
	 * @returns `true` if cues are equal, `false` otherwise
	 */
	static equal(cue1: Cue, cue2: Cue) {
		// Compare the start time, end time and payload of the cues first for
		// performance optimization.  We can avoid the more expensive recursive
		// checks if the top-level properties don't match.
		// See: https://github.com/shaka-project/shaka-player/issues/3018
		if (cue1.startTime != cue2.startTime || cue1.endTime != cue2.endTime ||
			cue1.payload != cue2.payload) {
			return false;
		}

		let k: keyof Cue;

		for (k in cue1) {
			if (k == 'startTime' || k == 'endTime' || k == 'payload') {
				// Already compared.
			}
			else if (k == 'nestedCues') {
				// This uses shaka.text.Cue.equal rather than just this.equal, since
				// otherwise recursing here will unbox the method and cause "this" to be
				// undefined in deeper recursion.
				if (!shaka.util.ArrayUtils.equal(
					cue1.nestedCues, cue2.nestedCues, shaka.text.Cue.equal)) {
					return false;
				}
			}
			else if (k == 'region' || k == 'cellResolution') {
				for (const k2 in cue1[k]) {
					if (cue1[k][k2] != cue2[k][k2]) {
						return false;
					}
				}
			}
			else if (Array.isArray(cue1[k])) {
				if (!shaka.util.ArrayUtils.equal(cue1[k], cue2[k])) {
					return false;
				}
			}
			else {
				if (cue1[k] != cue2[k]) {
					return false;
				}
			}
		}

		return true;
	}
}
