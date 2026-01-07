/**
 * Child boxes of Additional Metadata Container Box
 *
 * @public
 */
export type AdditionalMetadataContainerBoxChild = any;

/**
 * Additional Metadata Container Box - 'meco' - Container - 8.11.7.1
 *
 * @public
 */
export type AdditionalMetadataContainerBox = {
	type: 'meco';
	boxes: AdditionalMetadataContainerBoxChild[];
};
