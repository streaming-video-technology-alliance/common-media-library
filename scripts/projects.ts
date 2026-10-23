import { loadWorkspaces, sortWorkspaces } from './workspaces.ts'

// The packages that the release scripts publish, in any order. A new package joins this
// list in its first release-prep PR. `libs/mse` builds but is not published yet.
const published = [
	'libs/608',
	'libs/abr',
	'libs/c2pa',
	'libs/cmaf-ham',
	'libs/cmcd',
	'libs/cmsd',
	'libs/content-steering',
	'libs/cta',
	'libs/dash',
	'libs/drm',
	'libs/error-codes',
	'libs/id3',
	'libs/iso-8601',
	'libs/iso-bmff',
	'libs/request',
	'libs/structured-field-values',
	'libs/throughput',
	'libs/utils',
	'libs/webvtt',
	'libs/xml',
]

const workspaces = sortWorkspaces(loadWorkspaces('libs'))
const folders = new Set(workspaces.map(w => w.folder))
const missing = published.filter(folder => !folders.has(folder))

if (missing.length > 0) {
	throw new Error(`scripts/projects.ts lists packages that do not exist: ${missing.join(', ')}`)
}

// Sorted so that every peer comes before the packages that depend on it.
export const projects: string[] = workspaces.map(w => w.folder).filter(folder => published.includes(folder))
