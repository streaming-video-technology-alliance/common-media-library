import type { FullBox } from './FullBox.ts';

/**
 * Degradation Priority Box - 'stdp'
 *
 *
 * @beta
 */
export type DegradationPriorityBox = FullBox & {
	type: 'stdp';
	priority: number[];
};
