import type { DecodedId3Frame } from './DecodedId3Frame.ts'

/**
 * ID3 frame.
 *
 * @public
 */
export type Id3Frame = DecodedId3Frame<ArrayBufferLike | string | number>;
