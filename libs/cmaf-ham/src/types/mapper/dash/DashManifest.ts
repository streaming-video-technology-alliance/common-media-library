import type { Period } from './Period.ts';

/**
 * Json representation of the DASH Manifest
 *
 * @alpha
 */
export type DashManifest = {
	MPD: {
		$?: {
			maxSegmentDuration?: string;
			mediaPresentationDuration?: string;
			minBufferTime?: string;
			profiles?: string;
			type?: string;
			xmlns?: string;
		};
		Period: Period[];
	};
};
