import type { Fields } from '../boxes/Fields.ts';
import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts';
import type { SegmentIndexReference } from '../boxes/SegmentIndexReference.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a SegmentIndexBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SegmentIndexBox
 *
 *
 * @beta
 */
export function sidx(view: IsoView): Fields<SegmentIndexBox> {
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
	const references = view.readEntries<SegmentIndexReference>(referenceCount, () => {
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
