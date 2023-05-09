/**
 * Decoded ID3 frame.
 * 
 * @internal
 * 
 * @group ID3
 */
export type DecodedId3Frame<T> = { key: string; data: T; info?: any; };
