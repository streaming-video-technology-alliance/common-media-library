import type { Fields } from '../boxes/Fields.js';
import type { TrackRunBox } from '../boxes/TrackRunBox.js';
import type { TrackRunSample } from '../boxes/TrackRunSample.js';
import type { IsoView } from '../IsoView.js';

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
export function trun(view: IsoView): Fields<TrackRunBox> {
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
