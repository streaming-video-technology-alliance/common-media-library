/**
 * Represents a valid key system for given piece of content and key system requirements.
 * Used to initialize license acquisition operations.
 *
 * @public
 */
export type MediaKeySystemAccessRequest = {
	keySystem: string;
	configurations: MediaKeySystemConfiguration[];
};
