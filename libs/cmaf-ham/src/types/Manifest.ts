import type { CmcdStreamingFormat } from '@svta/cml-cmcd'
import type { Base } from './model/Base.ts'
import type { ContentSteering } from './model/content-steering/ContentSteering.ts'
import type { Duration } from './model/Duration.ts'
import type { ManifestType } from './manifest/ManifestType.ts'
import type { Presentation } from './model/Presentation.ts'

// NOTE: The old Manifest type is significantly different and appears to represent a very different concept. We'll need to discuss.
/**
 * CMAF-HAM Manifest type
 *
 * @alpha
 */
export type Manifest = Duration & Base & {
	type: ManifestType;
	format: CmcdStreamingFormat;
	presentations: Presentation[];
	contentSteering?: ContentSteering;

	// TODO: These have very DASH specific names.
	minimumUpdatePeriod: number;
	timeShiftBufferDepth: number;
};
