import type { IsoBoxContainerMap } from '../IsoBoxContainerMap.ts'

/**
 * The container box types that `readIsoBoxes` reads and `writeIsoBoxes` writes with no reader or writer.
 *
 * The list is read-only. To read another container box, add a reader that calls `readChildBoxes`.
 *
 * @public
 */
export const CONTAINERS: readonly string[] = [
	'dinf',
	'edts',
	'grpl',
	'ludt',
	'mdia',
	'meco',
	'mfra',
	'minf',
	'moof',
	'moov',
	'mvex',
	'rinf',
	'schi',
	'sinf',
	'stbl',
	'strd',
	'strk',
	'traf',
	'trak',
	'tref',
	'trgr',
	'udta',
	'vttc',
] satisfies (keyof IsoBoxContainerMap)[]
