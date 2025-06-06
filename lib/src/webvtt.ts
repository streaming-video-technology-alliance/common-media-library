/**
 * @groupDescription WebVTT
 * A collection of tools for working with Web VTT.
 *
 * @see {@link https://www.w3.org/TR/webvtt1/ | WebVTT: The Web Video Text Tracks Format}
 *
 * @packageDocumentation
 */
export { createWebVttCue } from './webvtt/createWebVttCue.js';
export { createWebVttRegion } from './webvtt/createWebVttRegion.js';
export { parseWebVtt } from './webvtt/parseWebVtt.js';
export { toVttCue } from './webvtt/toVttCue.js';
export { toVttRegion } from './webvtt/toVttRegion.js';
export { WebVttParser } from './webvtt/WebVttParser.js';
export { WebVttParsingError } from './webvtt/WebVttParsingError.js';
export { WebVttTransformer } from './webvtt/WebVttTransformer.js';
export { WebVttTransformStream } from './webvtt/WebVttTransformStream.js';

export type { TimestampMap } from './webvtt/TimestampMap.js';
export type { WebVttCue } from './webvtt/WebVttCue.js';
export type { WebVttCueFactory } from './webvtt/WebVttCueFactory.js';
export type { WebVttCueResult } from './webvtt/WebVttCueResult.js';
export type { WebVttErrorResult } from './webvtt/WebVttErrorResult.js';
export type { WebVttParseResult } from './webvtt/WebVttParseResult.js';
export type { WebVttParserOptions } from './webvtt/WebVttParserOptions.js';
export type { WebVttRegion } from './webvtt/WebVttRegion.js';
export type { WebVttRegionFactory } from './webvtt/WebVttRegionFactory.js';
export type { WebVttRegionResult } from './webvtt/WebVttRegionResult.js';
export type { WebVttResult } from './webvtt/WebVttResult.js';
export type { WebVttResultType } from './webvtt/WebVttResultType.js';
export type { WebVttStyleResult } from './webvtt/WebVttStyleResult.js';
export type { WebVttTimestampMapResult } from './webvtt/WebVttTimestampMapResult.js';
