import type { FullBox } from './FullBox.js';

/**
 * Degradation Priority Box - 'stdp'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DegradationPriorityBox = FullBox & {
	type: 'stdp';
	priority: number[];
};
