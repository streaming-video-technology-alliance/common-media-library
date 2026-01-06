import type { Base } from './model/Base.ts'
import type { Protection } from './model/content-protection/Protection.ts'
import type { Ham } from './model/Ham.ts'
import type { SelectionSet } from './SelectionSet.ts'
import type { Track } from './Track.ts'

/**
 * CMAF-HAM Switching Set type
 *
 * @alpha
 */
export type SwitchingSet = Ham & Base & {
	parent: SelectionSet;

	tracks: Track[];
	protection?: Protection;

	// TODO: Is this a DASH specific term?
	role: string;
};
