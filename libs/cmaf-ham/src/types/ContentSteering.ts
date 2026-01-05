import type { ContentSteeringPathway } from './ContentSteeringPathway.ts';

/**
 * CMAF-HAM Content Steering type
 *
 * @alpha
 */
export type ContentSteering = {
	url: string;
	pathways: ContentSteeringPathway[];
};
