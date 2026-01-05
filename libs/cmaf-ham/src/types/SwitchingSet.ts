import type { Base } from './Base.ts'
import type { Ham } from './Ham.ts'
import type { Protection } from './Protection.ts'
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
