/**
 * @groupDescription WebVTT
 * A collection of tools for working with Web VTT.
 *
 * @see {@link https://www.w3.org/TR/webvtt1/ | WebVTT: The Web Video Text Tracks Format}
 *
 * @packageDocumentation
 */
export { parseWebVtt } from './webvtt/parseWebVtt.js';
export { toVttCue } from './webvtt/toVttCue.js';
export { toVttRegion } from './webvtt/toVttRegion.js';
export { WebVttParser } from './webvtt/WebVttParser.js';
export { WebVttParsingError } from './webvtt/WebVttParsingError.js';

export type { TimestampMap } from './webvtt/TimestampMap.js';
export type { WebVttCue } from './webvtt/WebVttCue.js';
export type { WebVttCueFactory } from './webvtt/WebVttCueFactory.js';
export type { WebVttParseResult } from './webvtt/WebVttParseResult.js';
export type { WebVttParserOptions } from './webvtt/WebVttParserOptions.js';
export type { WebVttRegion } from './webvtt/WebVttRegion.js';
export type { WebVttRegionFactory } from './webvtt/WebVttRegionFactory.js';
