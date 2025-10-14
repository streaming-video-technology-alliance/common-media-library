import type { DecodedId3Frame } from './DecodedId3Frame.ts';

/**
 * ID3 frame.
 *
 *
 * @beta
 */
export type Id3Frame = DecodedId3Frame<ArrayBuffer | string | number>;
