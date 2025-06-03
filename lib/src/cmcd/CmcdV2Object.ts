import type { CmcdCustomKey } from './CmcdCustomKey';
import type { CmcdValue } from './CmcdValue';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat';
import type { CmcdStreamType } from './CmcdStreamType';
import type { CmcdPlayerState } from './CmcdPlayerState';

export const CMCD_V2_COMMON_KEYS = [
	'br', 
	'ab', 
	'bl', 
	'tbl', 
	'bs', 
	'cdn', 
	'cid', 
	'ltc', 
	'mtp', 
	'pr', 
	'sf', 
	'sid', 
	'bg', 
	'sta', 
	'st', 
	'ts', 
	'tpb', 
	'tb', 
	'lb', 
	'tab', 
	'lab', 
	'pt', 
	'ec', 
	'msd', 
	'v',
] as const;

/**
 * Common Media Client Data (CMCD) is a standardized set of HTTP request header fields and query string parameters.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdV2Object = {

	/**
	 * Custom key names may be used, but they MUST carry a hyphenated prefix to ensure that there will not be a namespace collision
	 * with future revisions to this specification. Clients SHOULD use a reverse-DNS syntax when defining their own prefix.
	 */
	[index: CmcdCustomKey]: CmcdValue;

	/////////////////
	// CMCD Object //
	/////////////////

	/**
	 * Encoded bitrate
	 *
	 * The encoded bitrate of the audio or video object being requested. This may not be known precisely by the player; however,
	 * it MAY be estimated based upon playlist/manifest declarations. If the playlist declares both peak and average bitrate values,
	 * the peak value should be transmitted.
	 *
	 * Integer kbps
	 */
	br?: number;

	/**
	 * Aggregate encoded bitrate
	 *
	 * Integer kbps
	 */
	ab?: number;

	/** Buffer length (ms) */
	bl?: number;
	
	/** Target buffer length (ms) */
	tbl?: number;

	/** Buffer starvation occurred since last request (boolean) */
	bs?: boolean;

	/** CDN ID (string, max 128 chars) */
	cdn?: string;
	
	/** Content ID (string, max 128 chars) */
	cid?: string;
	
	/** Live stream latency (ms) */
	ltc?: number;

	/** Measured throughput (kbps) */
	mtp?: number;

	/** Playback rate (decimal) */
	pr?: number;

	/** Streaming format */
	sf?: CmcdStreamingFormat;

	/** Session ID (string, max 64 chars, UUID recommended) */
	sid?: string;
	
	/** Backgrounded (all players in session not visible, boolean) */
	bg?: boolean;

	/** State (player state, e.g. "s", "p", etc.) */
	sta?: CmcdPlayerState;

	/** Stream type */
	st?: CmcdStreamType;

	/** Timestamp (ms since UNIX epoch, required for event mode) */
	ts?: number;

	/** Top playable bitrate (kbps) */
	tpb?: number;

	/** Top encoded bitrate in manifest (kbps) */
	tb?: number;

	/** Lowest encoded bitrate (kbps) */
	lb?: number;

	/** Top aggregated encoded bitrate (kbps) */
	tab?: number;

	/** Lowest aggregated encoded bitrate (kbps) */
	lab?: number;

	/** Playhead time (ms) */
	pt?: number;

	/** Error code(s), application-defined */
	ec?: string | string[];

	/** Media Start Delay (ms) */
	msd?: number;

	/** CMCD version (integer, omit if 1) */
	v?: number;
};
