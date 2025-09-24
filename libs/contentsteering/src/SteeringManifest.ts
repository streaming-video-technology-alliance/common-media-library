import type { PathwayClone } from './PathwayClone.js';

/**
 * A manifest for content steering.
 *
 * @group Content Steering
 *
 * @beta
 */
export type SteeringManifest = {
	/**
	 * The version of the content steering manifest.
	 */
	VERSION: number;

	/**
	 * The time to live of the content steering manifest in seconds.
	 */
	TTL: number;

	/**
	 * The URI to reload the content steering manifest.
	 */
	'RELOAD-URI'?: string;

	/**
	 * The priority of the pathways.
	 */
	'PATHWAY-PRIORITY': string[];

	/**
	 * The clones of the pathways.
	 */
	'PATHWAY-CLONES'?: PathwayClone[];
};
