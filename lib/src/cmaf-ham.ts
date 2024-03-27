/**
 * @packageDocumentation
 *
 * A collection of tools for working with Common Media Application Format - Hypothetical Application Model (CMAF-HAM).
 *
 * @alpha
 */
export type {
	Presentation,
	SelectionSet,
	AlignedSwitchingSet,
	SwitchingSet,
	VideoTrack,
	AudioTrack,
	TextTrack,
	Segment,
} from './cmaf/ham/types/model/index.js';
export type * from './cmaf/ham/types/index.js';
export * from './cmaf/ham/services/getTracks.js';
export * from './cmaf/ham/services/validateTracks.js';
export * from './cmaf/ham/services/converters/dashConverter.js';
export * from './cmaf/ham/services/converters/hlsConverter.js';
export * as default from './cmaf/index.js';
