import type { FullBox } from './FullBox.js';

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
