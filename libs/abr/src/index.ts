/**
 * Bitrate selection functionality.
 *
 * The package defines `BitrateSelector`, the type that every bitrate selection algorithm implements.
 * It ships `createThroughputSelector`, a rate-based selector, and `createBolaSelector`, a buffer-based selector.
 *
 * @packageDocumentation
 *
 * @beta
 */
export type * from './BitrateDecision.ts'
export type * from './BitrateSelector.ts'
export type * from './BitrateSelectorInput.ts'
export * from './BOLA_DEFAULT_BUFFER_TARGET.ts'
export type * from './BolaDecision.ts'
export type * from './BolaSelector.ts'
export type * from './BolaSelectorOptions.ts'
export * from './BolaState.ts'
export * from './createBolaSelector.ts'
export * from './createThroughputSelector.ts'
export * from './DEFAULT_SAFETY_FACTOR.ts'
export * from './DEFAULT_STARVATION_SAFETY_FACTOR.ts'
export * from './DEFAULT_STARVATION_TOLERANCE.ts'
export * from './DEFAULT_UPGRADE_FACTOR.ts'
export type * from './LadderRung.ts'
export type * from './SegmentSample.ts'
export type * from './ThroughputSelectorOptions.ts'
