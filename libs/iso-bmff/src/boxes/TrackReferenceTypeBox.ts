/**
 * Track Reference Type Box (`tref`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.3
 *
 * @public
 */
export type TrackReferenceTypeBox = {
	type: 'tref'
	trackIds: number[]
}
