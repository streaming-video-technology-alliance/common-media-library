import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Segment index reference
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Reference = {
	reference: number,
	subsegmentDuration: number,
	sap: number,
	referenceType: number,
	referencedSize: number,
	startsWithSap: number,
	sapType: number,
	sapDeltaTime: number,
};

/**
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SegmentIndexBox = FullBox & {
	referenceId: number,
	timescale: number,
	earliestPresentationTime: number,
	firstOffset: number,
	reserved: number,
	references: Reference[],
};

/**
 * Parse a SegmentIndexBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SegmentIndexBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function sidx(view: IsoView): SegmentIndexBox {
	const { readUint } = view;
	const { version, flags } = view.readFullBox();
	const v1 = version === 1;
	const size = v1 ? 8 : 4;

	const referenceId = readUint(4);
	const timescale = readUint(4);
	const earliestPresentationTime = readUint(size);
	const firstOffset = readUint(size);
	const reserved = readUint(2);
	const referenceCount = readUint(2);
	const references = view.readEntries<Reference>(referenceCount, () => {
		const entry = {} as any;

		entry.reference = readUint(4);
		entry.subsegmentDuration = readUint(4);
		entry.sap = readUint(4);
		entry.referenceType = (entry.reference >> 31) & 0x00000001;
		entry.referencedSize = entry.reference & 0x7FFFFFFF;
		entry.startsWithSap = (entry.sap >> 31) & 0x00000001;
		entry.sapType = (entry.sap >> 28) & 0x00000007;
		entry.sapDeltaTime = (entry.sap & 0x0FFFFFFF);

		return entry;
	});

	return {
		version,
		flags,
		referenceId,
		timescale,
		earliestPresentationTime,
		firstOffset,
		reserved,
		references,
	};
};
