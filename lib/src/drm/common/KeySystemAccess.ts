/**
 * Represents a valid key system for given piece of content and key system requirements.  
 * Used to initialize license acquisition operations.
 *
 * @group DRM
 * @public
 */
export type KeySystemAccess = {
	keySystem: string;
	configuration: MediaKeySystemConfiguration;
};
