/**
 * Segment index reference
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SegmentIndexReference = {
	reference: number;
	subsegmentDuration: number;
	sap: number;
	referenceType: number;
	referencedSize: number;
	startsWithSap: number;
	sapType: number;
	sapDeltaTime: number;
};
