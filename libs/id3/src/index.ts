/**
 * @groupDescription ID3
 * A collection of tools for working with ID3v2 tags.
 *
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-structure.html | ID3v2.4.0 Structure}
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html | ID3v2.4.0 Frames}
 *
 * @packageDocumentation
 */
export { canParseId3 } from './canParseId3.js';
export type { DecodedId3Frame } from './DecodedId3Frame.js';
export { getId3Data } from './getId3Data.js';
export { getId3Frames } from './getId3Frames.js';
export { getId3Timestamp } from './getId3Timestamp.js';
export { ID3_SCHEME_ID_URI } from './ID3_SCHEME_ID_URI.js';
export type { Id3Frame } from './Id3Frame.js';
export { isId3TimestampFrame } from './isId3TimestampFrame.js';

