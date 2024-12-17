import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * Subsegment range
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Range = {
	level: number;
	rangeSize: number;
};

/**
 * Subsegment
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Subsegment = {
	rangesCount: number;
	ranges: Range[];
};

/**
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubsegmentIndexBox = FullBox & {
	subsegmentCount: number;
	subsegments: Subsegment[];
};

/**
 * Parse a SubsegmentIndexBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubsegmentIndexBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function ssix(view: IsoView): SubsegmentIndexBox {
	const { version, flags } = view.readFullBox();
	const subsegmentCount = view.readUint(4);
	const subsegments = view.readEntries(subsegmentCount, () => {
		const rangesCount = view.readUint(4);
		const ranges = view.readEntries(rangesCount, () => ({
			level: view.readUint(1),
			rangeSize: view.readUint(3),
		}));
		return { rangesCount, ranges };
	});

	return {
		version,
		flags,
		subsegmentCount,
		subsegments,
	};
};
