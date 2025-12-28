import type { FullBox } from './FullBox.ts'

/**
 * Degradation Priority Box - 'stdp'
 *
 * @public
 */
export type DegradationPriorityBox = FullBox & {
	type: 'stdp';
	priority: number[];
};

/**
 * @public
 */
export type stdp = DegradationPriorityBox;
