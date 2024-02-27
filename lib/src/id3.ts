/**
 * @groupDescription ID3
 * A collection of tools for working with ID3v2 tags.
 *
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-structure.html | ID3v2.4.0 Structure}
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html | ID3v2.4.0 Frames}
 *
 * @packageDocumentation
 */
export type { DecodedId3Frame } from './id3/DecodedId3Frame.js';
export type { Id3Frame } from './id3/Id3Frame.js';
export { canParseId3 } from './id3/canParseId3.js';
export { getId3Data } from './id3/getId3Data.js';
export { getId3Frames } from './id3/getId3Frames.js';
export { getId3Timestamp } from './id3/getId3Timestamp.js';
export { isId3TimestampFrame } from './id3/isId3TimestampFrame.js';
export { decodeId3TextFrame } from './id3/util/decodeId3TextFrame.js';
