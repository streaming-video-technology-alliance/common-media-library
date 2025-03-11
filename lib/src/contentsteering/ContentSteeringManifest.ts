import type { ContentSteeringPathwayClone } from './ContentSteeringPathwayClone.js';

export type ContentSteeringManifest = {
	version: number;
	ttl: number;
	reloadUri: string;
	pathwayPriority: string[];
	pathwayClones: ContentSteeringPathwayClone[];
}
