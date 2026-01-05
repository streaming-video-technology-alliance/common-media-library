import type { ContentSteeringPathway } from './ContentSteeringPathway.ts'

export type ContentSteering = {
	url: string;
	pathways: ContentSteeringPathway[];
};
