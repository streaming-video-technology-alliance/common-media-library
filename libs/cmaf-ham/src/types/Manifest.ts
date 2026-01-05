import type { CmcdStreamingFormat } from '@svta/cml-cmcd'
import type { Base } from './Base.ts'
import type { ContentSteering } from './ContentSteering.ts'
import type { Duration } from './Duration.ts'
import type { ManifestType } from './ManifestType.ts'
import type { Presentation } from './Presentation.ts'

export type Manifest = Duration & Base & {
	type: ManifestType;
	format: CmcdStreamingFormat;
	presentations: Presentation[];
	contentSteering?: ContentSteering;

	// TODO: These have very DASH specific names.
	minimumUpdatePeriod: number;
	timeShiftBufferDepth: number;
};
