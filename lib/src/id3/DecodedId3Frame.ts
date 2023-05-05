/**
 * Decoded ID3 frame.
 * 
 * @internal
 */
export type DecodedId3Frame<T> = { key: string; data: T; info?: any; };
