import type { Base } from './Base.ts'
import type { Protection } from './content-protection/Protection.ts'
import type { Ham } from './Ham.ts'
import type { Track } from './Track.ts'

/**
 * CMAF-HAM Switching Set type
 *
 * @alpha
 */
export type SwitchingSet = Ham & Base & {
	tracks: Track[];
	protection?: Protection;

	// TODO: Is this a DASH specific term? - Yes: Revisit for shareable concepts/categorization, e.g. CHARACTERISTICS + values on #EXT-X-MEDIA
	role?: string;
};
