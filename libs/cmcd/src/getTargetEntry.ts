import type { ReporterState } from './ReporterState.ts'
import type { TargetEntry } from './TargetEntry.ts'
import type { TargetState } from './TargetState.ts'

/** The target's entry for a reporter, created on first use. */
export function getTargetEntry(target: TargetState, reporter: ReporterState): TargetEntry {
	let entry = target.entries.get(reporter)
	if (!entry) {
		entry = { bs: false, ec: [] }
		target.entries.set(reporter, entry)
	}
	return entry
}
