/**
 * An edit list entry.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EditListEntry = {
	segmentDuration: number;
	mediaTime: number;
	mediaRateInteger: number;
	mediaRateFraction: number;
};
