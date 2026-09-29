/**
 * A content steering engine.
 *
 *
 * @beta
 */
export type SteeringEngine = {
	/**
	 * The selected pathway.
	 */
	readonly pathway: string | undefined;

	/**
	 * The selected pathway first, then the other known pathways of the
	 * priority list that are not penalized, in priority order.
	 */
	readonly priority: readonly string[];

	/**
	 * Sends the first request, or resumes the requests after `stop()`.
	 *
	 * @returns A promise that resolves when the engine has processed the
	 * response. The promise never rejects.
	 */
	start(): Promise<void>;

	/**
	 * Cancels the timers and ignores any response that arrives later.
	 * The engine keeps its state.
	 */
	stop(): void;

	/**
	 * Excludes a pathway from the selection for the penalty duration.
	 * The engine selects a pathway before the method returns.
	 *
	 * @param pathway - The pathway. The default is the selected pathway.
	 */
	penalize(pathway?: string): void;

	/**
	 * Changes the inputs of the engine. The engine keeps its penalties and
	 * its request schedule, and it selects a pathway before the method returns.
	 *
	 * @param changes - The new values. `uri` replaces the steering URI.
	 * `pathways` replaces the pathways of the Content Description.
	 * `priority` replaces the priority list until the next valid Steering Manifest.
	 */
	update(changes: { readonly uri?: string; readonly pathways?: readonly string[]; readonly priority?: readonly string[] }): void;
};
