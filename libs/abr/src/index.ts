/**
 * Bitrate selection functionality.
 *
 * The package defines `BitrateSelector`, the type that every bitrate selection algorithm implements,
 * and ships `ThroughputSelector` as the default implementation.
 *
 * @packageDocumentation
 *
 * @beta
 */
export type * from './BitrateDecision.ts'
export type * from './BitrateSelector.ts'
export type * from './BitrateSelectorInput.ts'
export * from './DEFAULT_SAFETY_FACTOR.ts'
export * from './DEFAULT_UPGRADE_FACTOR.ts'
export type * from './SegmentSample.ts'
export * from './ThroughputSelector.ts'
export type * from './ThroughputSelectorOptions.ts'
