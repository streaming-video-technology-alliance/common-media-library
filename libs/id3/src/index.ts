/**
 * A collection of tools for working with ID3v2 tags.
 *
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-structure.html | ID3v2.4.0 Structure}
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html | ID3v2.4.0 Frames}
 *
 * @packageDocumentation
 */
export * from './canParseId3.js';
export type * from './DecodedId3Frame.js';
export * from './getId3Data.js';
export * from './getId3Frames.js';
export * from './getId3Timestamp.js';
export * from './ID3_SCHEME_ID_URI.js';
export type * from './Id3Frame.js';
export * from './isId3TimestampFrame.js';
export * from './util/decodeId3Frame.js';
export * from './util/decodeId3TextFrame.js';
export * from './util/isId3Footer.js';
export * from './util/isId3Header.js';
export * from './util/readId3Size.js';
export * from './util/toArrayBuffer.js';
export * from './util/utf8.js';
export * from './util/utf8ArrayToStr.js';

