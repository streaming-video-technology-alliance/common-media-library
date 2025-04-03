/**
 * A collection of tools for working with DRM.
 *
 * @packageDocumentation
 *
 * @beta
 */

// common utils
export * from './drm/cemc/findCencContentProtection.js';
export * from './drm/cemc/getPSSHData.js';
export * from './drm/cemc/getPSSHForKeySystem.js';
export * from './drm/cemc/parsePSSHList.js';
export * from './drm/cemc/parseInitDataFromContentProtection.js';
export * from './drm/cemc/getLicenseServerUrlFromContentProtection.js';

// key system utils
export * from './drm/keysystem/getKeySystemAccess.js';
export * from './drm/keysystem/getLegacyKeySystemAccess.js';
export * from './drm/keysystem/getSupportedKeySystemConfiguration.js';
export * from './drm/keysystem/createMediaKeySystemConfiguration.js';

// fairplay utilities
export * from './drm/fairplay/getId.js';
export * from './drm/fairplay/getLicenseServerUrl.js';
export * from './drm/fairplay/extractContentId.js';
export * from './drm/fairplay/decodeFairPlayLicense.js';
export * from './drm/fairplay/concatInitDataIdAndCertificate.js';

// drm types
export type { KeySystemConfiguration } from './drm/common/KeySystemConfiguration.js';
export type { KeyMessage } from './drm/common/KeyMessage.js';
export type { KeySystemAccess } from './drm/common/KeySystemAccess.js';
export type { LicenseRequest } from './drm/common/LicenseRequest.js';
export type { MediaCapability } from './drm/common/MediaCapability.js';
export type { ContentProtection } from './drm/common/ContentProtection.js';
export type { KeySystem } from './drm/common/KeySystem.js';

// drm constants
export * from './drm/common/CBCS.js';
export * from './drm/common/CENC.js';
export * from './drm/common/CLEAR_KEY_SYSTEM.js';
export * from './drm/common/CLEAR_KEY_UUID.js';
export * from './drm/common/ENCRYPTION_SCHEME.js';
export * from './drm/common/EXPIRED.js';
export * from './drm/common/HW_SECURE_ALL.js';
export * from './drm/common/HW_SECURE_CRYPTO.js';      
export * from './drm/common/HW_SECURE_DECODE.js';
export * from './drm/common/INDIVIDUALIZATION_REQUEST.js';
export * from './drm/common/INITIALIZATION_DATA_TYPE.js';
export * from './drm/common/INTERNAL_ERROR.js';
export * from './drm/common/KEYIDS.js';
export * from './drm/common/LICENSE_RELEASE.js';
export * from './drm/common/LICENSE_RENEWAL.js';
export * from './drm/common/LICENSE_REQUEST.js';
export * from './drm/common/MEDIA_KEY_MESSAGE_TYPES.js';
export * from './drm/common/MEDIA_KEY_STATUS.js';
export * from './drm/common/MP4_PROTECTION_SCHEME';
export * from './drm/common/OUTPUT_DOWNSCALED.js';
export * from './drm/common/OUTPUT_RESTRICTED.js';
export * from './drm/common/PLAYREADY_KEY_SYSTEM.js';
export * from './drm/common/PLAYREADY_RECOMMENDATION_KEY_SYSTEM.js';
export * from './drm/common/PLAYREADY_UUID.js';
export * from './drm/common/RELEASED.js';
export * from './drm/common/STATUS_PENDING.js';
export * from './drm/common/SW_SECURE_CRYPTO.js';
export * from './drm/common/SW_SECURE_DECODE.js';
export * from './drm/common/USABLE.js';
export * from './drm/common/W3C_CLEAR_KEY_UUID.js';
export * from './drm/common/WEBM.js';
export * from './drm/common/WEBM.js';
export * from './drm/common/WIDEVINE_KEY_SYSTEM.js';
export * from './drm/common/WIDEVINE_ROBUSTNESS.js';
export * from './drm/common/WIDEVINE_UUID.js';
