/**
 * Represents a ContentProtection element in DASH manifest.
 *
 * @public
 */
export type ContentProtection = {
	schemeIdUri?: string;
	value?: string;
	pssh?: string;
	laUrl?: string;
};
