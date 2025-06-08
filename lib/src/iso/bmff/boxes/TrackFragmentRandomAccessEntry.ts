/**
 * Track fragment random access entry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentRandomAccessEntry = {
	time: number;
	moofOffset: number;
	trafNumber: number;
	trunNumber: number;
	sampleNumber: number;
};
