import type { PathwayClone } from './PathwayClone.ts'
import type { SteeringError } from './SteeringError.ts'
import type { SteeringManifest } from './SteeringManifest.ts'
import type { SteeringProtocol } from './SteeringProtocol.ts'
import type { SteeringRequester } from './SteeringRequester.ts'

/**
 * The configuration of a content steering engine.
 *
 *
 * @beta
 */
export type SteeringEngineConfig = {
	/**
	 * The delivery protocol.
	 */
	protocol: SteeringProtocol;

	/**
	 * The absolute URI of the first Steering Manifest request.
	 */
	uri: string;

	/**
	 * The pathway IDs that the Content Description defines.
	 */
	pathways: readonly string[];

	/**
	 * The pathway that the player applies now. The priority list before the
	 * first valid Steering Manifest starts with this pathway, followed by the
	 * other `pathways`.
	 */
	pathway?: string;

	/**
	 * The penalty duration in milliseconds. The default is
	 * `DEFAULT_PATHWAY_PENALTY` for HLS, and the TTL of the last valid
	 * Steering Manifest for DASH.
	 */
	penalty?: number;

	/**
	 * When `true`, the first request has no steering query parameters.
	 * For DASH, set it from `@queryBeforeStart`.
	 */
	queryBeforeStart?: boolean;

	/**
	 * The function that sends the Steering Manifest requests. The default uses `fetch`.
	 */
	requester?: SteeringRequester;

	/**
	 * Returns the throughput estimate of the player for a pathway, in bits per second.
	 */
	getThroughput?: (pathway: string) => number | undefined;

	/**
	 * DASH only. Returns every pathway that the player used since the
	 * previous request, for `_DASH_pathway`. Without this function, the
	 * engine lists the pathways that it selected since the previous request.
	 */
	getReportedPathways?: () => readonly string[];

	/**
	 * Returns `false` for a valid pathway clone that the player cannot build.
	 * The engine then ignores the clone. The engine calls this function for
	 * each valid clone of each Steering Manifest, before `onManifest`.
	 */
	acceptClone?: (clone: PathwayClone) => boolean;

	/**
	 * Called when the selected pathway changes.
	 */
	onPathwayChange?: (pathway: string) => void;

	/**
	 * Called with each valid Steering Manifest and its pathway clones, before
	 * the engine selects a pathway. The context has the URI of the response
	 * in `url`, and the URI of the next request in `reloadUri`.
	 */
	onManifest?: (manifest: SteeringManifest, clones: readonly PathwayClone[], context: { readonly url: string; readonly reloadUri: string }) => void;

	/**
	 * Called when a request fails, when a Steering Manifest is not valid,
	 * or when a callback throws and no caller can receive the exception.
	 */
	onError?: (error: SteeringError) => void;
};
