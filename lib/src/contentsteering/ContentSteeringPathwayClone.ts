import type { ContentSteeringUriReplacement } from './ContentSteeringUriReplacement.js';

export type ContentSteeringPathwayClone = {
	baseId: string,        // REQUIRED. Pathway ID of the Base Pathway
	id: string,             // REQUIRED. Pathway ID for the Pathway Clone
	uriReplacement: ContentSteeringUriReplacement,       // REQUIRED. URI replacement rules
}
