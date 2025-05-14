import type { DecodedId3Frame } from './DecodedId3Frame';

/**
 * ID3 frame.
 *
 * @group ID3
 *
 * @beta
 */
export type Id3Frame = DecodedId3Frame<ArrayBuffer | string | number>;
