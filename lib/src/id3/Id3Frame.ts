import { DecodedId3Frame } from './DecodedId3Frame.js';

/**
 * ID3 frame.
 */
export type Id3Frame = DecodedId3Frame<ArrayBuffer | string | number>;
