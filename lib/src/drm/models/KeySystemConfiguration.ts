import { MediaCapability } from '../models/MediaCapability';

/**
 * Represents the configuration options for requesting key system access.
 *
 * @group DRM
 */
export interface KeySystemConfiguration {
  initDataTypes?: string[];
  audioCapabilities?: MediaCapability[];
  videoCapabilities?: MediaCapability[];
  distinctiveIdentifier?: 'required' | 'optional' | 'not-allowed';
  persistentState?: 'required' | 'optional' | 'not-allowed';
  sessionTypes?: string[];
}
