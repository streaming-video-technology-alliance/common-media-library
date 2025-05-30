import type { MediaCapability } from './MediaCapability.js';

/**
 * Represents the configuration options for requesting key system access.
 *
 * @group DRM
 * @beta
 */
export type KeySystemConfiguration = {
	initDataTypes?: string[];
	audioCapabilities?: MediaCapability[];
	videoCapabilities?: MediaCapability[];
	distinctiveIdentifier?: 'required' | 'optional' | 'not-allowed';
	persistentState?: 'required' | 'optional' | 'not-allowed';
	sessionTypes?: string[];
};

