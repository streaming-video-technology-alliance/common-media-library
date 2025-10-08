import type { AdaptationSet } from './AdaptationSet.js';

/**
 * DASH Period
 *
 * @alpha
 */
export type Period = {
	$: {
		duration: string;
		id?: string;
		start?: string;
	};
	AdaptationSet: AdaptationSet[];
};
