/**
 * A collection of tools for working with ID3v2 tags.
 *
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-structure.html | ID3v2.4.0 Structure}
 * @see {@link https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html | ID3v2.4.0 Frames}
 *
 * @packageDocumentation
 */
export * from './canParseId3.ts'
export type * from './DecodedId3Frame.ts'
export * from './getId3Data.ts'
export * from './getId3Frames.ts'
export * from './getId3Timestamp.ts'
export * from './ID3_SCHEME_ID_URI.ts'
export type * from './Id3Frame.ts'
export * from './isId3TimestampFrame.ts'
export * from './util/decodeId3Frame.ts'
export * from './util/decodeId3TextFrame.ts'
export * from './util/isId3Footer.ts'
export * from './util/isId3Header.ts'
export type * from './util/RawId3Frame.ts'
export * from './util/readId3Size.ts'
export * from './util/toArrayBuffer.ts'
export * from './util/utf8.ts'
export * from './util/utf8ArrayToStr.ts'
