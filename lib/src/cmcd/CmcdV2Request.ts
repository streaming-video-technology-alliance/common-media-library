import type { CmcdObjectType } from './CmcdObjectType';

export const CMCD_V2_REQUEST_MODE_AVAILABLE_KEYS = [
	'd', 
	'dl', 
	'nor', 
	'ot', 
	'rtp', 
	'su',
] as const;

/**
 * CMCD v2 - Request group keys.
 */
export type CmcdV2Request = {
	/** Object duration (ms) */
	d?: number;

	/** Deadline for when object must be available (ms) */
	dl?: number;

	/** Next object request (relative path or list) */
	nor?: string;

	/** Object type */	
	ot?: CmcdObjectType

	/** Requested maximum throughput (kbps) */
	rtp?: number;

	/** Startup flag (boolean) */
	su?: boolean;
};
