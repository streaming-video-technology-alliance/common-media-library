/**
 * C2PA (Coalition for Content Provenance and Authenticity) validation
 * for BMFF/MP4 live video streams.
 *
 * @see {@link https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html | C2PA Specification}
 *
 * @packageDocumentation
 */

// Validation functions
export * from './init/validateC2paInitSegment.ts'
export * from './segment/validateC2paSegment.ts'
export * from './manifestbox/validateC2paManifestBoxSegment.ts'

// Result types
export type * from './C2paAssertion.ts'
export type * from './C2paManifest.ts'
export type * from './C2paSignatureInfo.ts'
export type * from './init/InitSegmentValidation.ts'
export type * from './segment/SegmentValidation.ts'
export type * from './manifestbox/ManifestBoxValidation.ts'
export type * from './cose/CoseKeyJwk.ts'

// Sequence state
export type * from './vsi/SequenceState.ts'

// Error codes
export * from './LiveVideoStatusCode.ts'
