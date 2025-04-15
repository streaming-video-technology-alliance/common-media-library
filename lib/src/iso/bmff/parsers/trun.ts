import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Track run sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackRunSample = {
	sampleDuration?: number;
	sampleSize?: number;
	sampleFlags?: number;
	sampleCompositionTimeOffset?: number;
};

/**
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 *
 * Note: the 'trun' box has a direct relation to the 'tfhd' box for defaults.
 * These defaults are not set explicitly here, but are left to resolve for the user.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackRunBox = FullBox & {
	sampleCount: number;
	dataOffset?: number;
	firstSampleFlags?: number;
	samples: TrackRunSample[];
};

/**
 * Parse a TrackRunBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackRunBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function trun(view: IsoView): TrackRunBox {
	const { version, flags } = view.readFullBox();
	const sampleCount = view.readUint(4);
	let dataOffset: number | undefined;
	let firstSampleFlags: number | undefined;

	if (flags & 0x1) {
		dataOffset = view.readInt(4);
	}

	if (flags & 0x4) {
		firstSampleFlags = view.readUint(4);
	}

	const samples = view.readEntries<TrackRunSample>(sampleCount, () => {
		const sample: TrackRunSample = {};

		if (flags & 0x100) {
			sample.sampleDuration = view.readUint(4);
		}
		if (flags & 0x200) {
			sample.sampleSize = view.readUint(4);
		}
		if (flags & 0x400) {
			sample.sampleFlags = view.readUint(4);
		}
		if (flags & 0x800) {
			sample.sampleCompositionTimeOffset = (version === 1) ? view.readInt(4) : view.readUint(4);
		}

		return sample;
	});

	return {
		version,
		flags,
		sampleCount,
		dataOffset,
		firstSampleFlags,
		samples,
	};
};
