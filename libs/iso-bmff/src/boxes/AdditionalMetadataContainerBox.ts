/**
 * Child boxes of Additional Metadata Container Box
 *
 * @public
 */
export type AdditionalMetadataContainerBoxChild = any;

/**
 * Additional Metadata Container Box - 'meta' - Container
 *
 * @public
 */
export type AdditionalMetadataContainerBox = {
	type: 'meta';
	boxes: AdditionalMetadataContainerBoxChild[];
};

/**
 * @public
 */
export type meco = AdditionalMetadataContainerBox;
