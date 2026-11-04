// Declarations that the example check prepends to the blocks of steering-engine.md.
declare const abr: { getEstimate(pathway: string): number | undefined }
declare const player: {
	addClones(clones: readonly import('@svta/cml-content-steering').PathwayClone[]): void
	applyPathway(pathway: string): void
	log(message: string): void
	reportBug(cause: unknown): void
}
declare const engine: import('@svta/cml-content-steering').SteeringEngine
