/**
 * A collection of tools for working with Common Media Application Format - Hypothetical Application Model (CMAF-HAM).
 *
 * @packageDocumentation
 *
 * @beta
 */
export { Presentation } from './cmaf/ham/model/Presentation.js';
export { SwitchingSet } from './cmaf/ham/model/SwitchingSet.js';
export { Track } from './cmaf/ham/model/Track.js';
export { hamToM3u8, mpdToHam } from './cmaf/ham/manifestParser.js';
export { parseM3u8 } from './cmaf/utils/m3u8.js';
