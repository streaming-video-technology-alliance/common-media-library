import type { AlignedSwitchingSet } from './AlignedSwitchingSet.ts'
import type { Ham } from './Ham.ts'
import type { Presentation } from './Presentation.ts'
import type { SwitchingSet } from './SwitchingSet.ts'
import type { TrackType } from './TrackType.ts'

/**
 * CMAF-HAM Selection Set type
 *
 * @alpha
 */
// TODO: Find a way to generalize these selection set types.
export type SelectionSet = Ham & {
	parent: Presentation;

	switchingSets: SwitchingSet[];
	alignedSwitchingSets?: AlignedSwitchingSet[];

	// TODO: This is a convenience field to allow for type checking of the selection set.
	//       Otherwise we would need to drill down to the tracks to get the type.
	type: TrackType;
};
