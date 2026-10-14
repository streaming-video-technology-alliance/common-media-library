/**
 * Bitrate selection functionality.
 *
 * The package defines `BitrateSelector`, the type that every bitrate selection algorithm implements,
 * and ships `createThroughputSelector` as the default implementation.
 *
 * @packageDocumentation
 *
 * @beta
 */
export type * from './BitrateDecision.ts'
export type * from './BitrateSelector.ts'
export type * from './BitrateSelectorInput.ts'
export * from './createThroughputSelector.ts'
export * from './DEFAULT_SAFETY_FACTOR.ts'
export * from './DEFAULT_STARVATION_TOLERANCE.ts'
export * from './DEFAULT_UPGRADE_FACTOR.ts'
export type * from './LadderRung.ts'
export type * from './SegmentSample.ts'
export type * from './ThroughputSelectorOptions.ts'
