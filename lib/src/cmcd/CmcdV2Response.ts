import type { CmcdObjectType } from './CmcdObjectType';

/**
 * CMCD v2 - Response-only and timing keys.
 */
export const CMCD_V2_RESPONSE_MODE_KEYS = [
	'd', 
	'dl', 
	'nor', 
	'ot', 
	'rtp', 
	'rc', 
	'su', 
	'ttfb', 
	'ttfbb', 
	'ttlb', 
	'url', 
	'cmsdd', 
	'cmsds',
] as const;

export type CmcdV2Response = {
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

	/** Response code for object request (response mode) */
	rc?: number;

	/** Startup flag (boolean) */
	su?: boolean;

	/** Time to first byte (ms; response mode) */
	ttfb?: number;

	/** Time to first body byte (ms; response mode) */
	ttfbb?: number;

	/** Time to last byte (ms; response mode) */
	ttlb?: number;

	/** Requested URL (string; response mode) */
	url?: string;

	/** CMSD Dynamic Header (response mode) */
	cmsdd?: string;
  
	/** CMSD Static Header (response mode) */
	cmsds?: string;
};
