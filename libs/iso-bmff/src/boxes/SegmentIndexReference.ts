/**
 * Segment index reference
 *
 * @public
 */
export type SegmentIndexReference = {
	subsegmentDuration: number
	referenceType: number
	referencedSize: number
	startsWithSap: number
	sapType: number
	sapDeltaTime: number
}
