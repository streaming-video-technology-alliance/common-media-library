/**
 * Represents a ContentProtection element in DASH manifest.
 *
 * @beta
 */
export type ContentProtection = {
	schemeIdUri?: string;
	value?: string;
	pssh?: string;
	laUrl?: string;
}; 
