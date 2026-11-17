/**
 * Track Reference Type Box: a child of the `tref` box. The box type is the reference type, such as `hint` or `cdsc`.
 *
 * ISO/IEC 14496-12:2015 - 8.3.3
 *
 * @public
 */
export type TrackReferenceTypeBox = {
	type: 'tref'
	trackIds: number[]
}
