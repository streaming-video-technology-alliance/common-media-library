import type { FullBox } from './FullBox.ts'

/**
 * Degradation Priority Box (`stdp`).
 *
 * ISO/IEC 14496-12:2015 - 8.5.3
 *
 * @public
 */
export type DegradationPriorityBox = FullBox & {
	type: 'stdp'
	priority: number[]
}
