/**
 * Returns the first pathway of a priority list that is known and not penalized.
 *
 * @param priority - The priority list.
 * @param known - The known pathways.
 * @param penalized - The penalized pathways.
 * @returns The pathway, or `undefined` when no pathway qualifies.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-7 | Steering Client Responsibilities, step 5}
 *
 * @internal
 */
export function selectPathway(priority: readonly string[], known: ReadonlySet<string>, penalized: ReadonlyMap<string, number>): string | undefined {
	return priority.find(pathway => known.has(pathway) && !penalized.has(pathway))
}
