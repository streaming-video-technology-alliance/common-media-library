import { isValidPathwayClone } from './isValidPathwayClone.ts'
import type { PathwayClone } from './PathwayClone.ts'
import { toHostname } from './toHostname.ts'
import type { UriReplacement } from './UriReplacement.ts'

const PATHWAY_ID = /^[\w.-]+$/

/**
 * Returns the valid pathway clones of a Steering Manifest, in array order.
 *
 * @param clones - The `PATHWAY-CLONES` array.
 * @param pathways - The pathway IDs of the Content Description.
 * @param accept - Returns `false` to refuse a clone. A refused clone cannot be the base of a later clone.
 * @returns The valid pathway clones.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-5 | Pathway Cloning}
 *
 * @internal
 */
export function resolveClones(clones: readonly unknown[], pathways: readonly string[], accept: (clone: PathwayClone) => boolean): PathwayClone[] {
	const known = new Set(pathways)
	const valid: PathwayClone[] = []

	for (const item of clones) {
		const clone = item as PathwayClone

		if (!isValidPathwayClone(clone)) {
			continue
		}

		const id = clone.ID

		if (!PATHWAY_ID.test(id) || known.has(id) || !known.has(clone['BASE-ID']) || !isValidReplacement(clone['URI-REPLACEMENT'])) {
			continue
		}

		if (!accept(clone)) {
			continue
		}

		known.add(id)
		valid.push(clone)
	}

	return valid
}

function isValidReplacement({ HOST, PARAMS }: UriReplacement): boolean {
	if (HOST !== undefined && (typeof HOST !== 'string' || toHostname(HOST) === undefined)) {
		return false
	}

	if (PARAMS === undefined) {
		return true
	}

	return typeof PARAMS === 'object' && PARAMS !== null && Object.keys(PARAMS).every(name => name !== '' && typeof PARAMS[name] === 'string')
}
