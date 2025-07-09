import type { UriReplacement } from './UriReplacement.js';

/**
 * A pathway clone for content steering.
 *
 * @group Content Steering
 *
 * @beta
 */
export type PathwayClone = {
	/**
	 * A string that specifies the Pathway ID of the Base Pathway
	 */
	'BASE-ID': string;

	/**
	 * A string that specifies the Pathway ID for the Pathway Clone
	 */
	'ID': string;

	/**
	 * An object that defines URI modifications to apply during the cloning process.
	 */
	'URI-REPLACEMENT': UriReplacement;
};
