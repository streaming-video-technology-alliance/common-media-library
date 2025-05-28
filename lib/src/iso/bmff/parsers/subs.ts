import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Sub sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubSample = {
	subsampleSize: number;
	subsamplePriority: number;
	discardable: number;
	codecSpecificParameters: number;
};

/**
 * Sub sample entry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubSampleEntry = {
	sampleDelta: number;
	subsampleCount: number;
	subsamples: SubSample[];
};

/**
 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubSampleInformationBox = FullBox & {
	entryCount: number;
	entries: SubSampleEntry[];
};

/**
 * Parse a SubSampleInformationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubSampleInformationBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function subs(view: IsoView): SubSampleInformationBox {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);
	const entries = view.readEntries(entryCount, () => {
		const sampleDelta = view.readUint(4);
		const subsampleCount = view.readUint(2);
		const subsamples = view.readEntries(subsampleCount, () => ({
			subsampleSize: view.readUint((version === 1) ? 4 : 2),
			subsamplePriority: view.readUint(1),
			discardable: view.readUint(1),
			codecSpecificParameters: view.readUint(4),
		}));

		return {
			sampleDelta,
			subsampleCount,
			subsamples,
		};
	});

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
