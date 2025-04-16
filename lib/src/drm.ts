/**
 * A collection of tools for working with DRM.
 *
 * @packageDocumentation
 *
 * @beta
 */

// common utils
export * from './drm/cenc/findCencContentProtection.ts';
export * from './drm/cenc/getLicenseServerUrlFromContentProtection.ts';
export * from './drm/cenc/getPSSHData.ts';
export * from './drm/cenc/getPSSHForKeySystem.ts';
export * from './drm/cenc/parseInitDataFromContentProtection.ts';
export * from './drm/cenc/parsePSSHList.ts';

// key system utils
export * from './drm/keysystem/createMediaKeySystemConfiguration.ts';
export * from './drm/keysystem/getKeySystemAccess.ts';
export * from './drm/keysystem/getLegacyKeySystemAccess.ts';
export * from './drm/keysystem/getSupportedKeySystemConfiguration.ts';

// fairplay utilities
export * from './drm/fairplay/concatInitDataIdAndCertificate.ts';
export * from './drm/fairplay/decodeFairPlayLicense.ts';
export * from './drm/fairplay/extractContentId.ts';
export * from './drm/fairplay/getId.ts';
export * from './drm/fairplay/getLicenseServerUrl.ts';

// drm types
export type { ContentProtection } from './drm/common/ContentProtection.ts';
export type { KeyMessage } from './drm/common/KeyMessage.ts';
export type { KeySystem } from './drm/common/KeySystem.ts';
export type { KeySystemAccess } from './drm/common/KeySystemAccess.ts';
export type { KeySystemConfiguration } from './drm/common/KeySystemConfiguration.ts';
export type { LicenseRequest } from './drm/common/LicenseRequest.ts';
export type { MediaCapability } from './drm/common/MediaCapability.ts';

// drm constants
export * from './drm/common/CBCS.ts';
export * from './drm/common/CENC.ts';
export * from './drm/common/CLEAR_KEY_SYSTEM.ts';
export * from './drm/common/CLEAR_KEY_UUID.ts';
export * from './drm/common/ENCRYPTION_SCHEME.ts';
export * from './drm/common/EXPIRED.ts';
export * from './drm/common/HW_SECURE_ALL.ts';
export * from './drm/common/HW_SECURE_CRYPTO.ts';
export * from './drm/common/HW_SECURE_DECODE.ts';
export * from './drm/common/INDIVIDUALIZATION_REQUEST.ts';
export * from './drm/common/INITIALIZATION_DATA_TYPE.ts';
export * from './drm/common/INTERNAL_ERROR.ts';
export * from './drm/common/KEYIDS.ts';
export * from './drm/common/LICENSE_RELEASE.ts';
export * from './drm/common/LICENSE_RENEWAL.ts';
export * from './drm/common/LICENSE_REQUEST.ts';
export * from './drm/common/MEDIA_KEY_MESSAGE_TYPES.ts';
export * from './drm/common/MEDIA_KEY_STATUS.ts';
export * from './drm/common/MP4_PROTECTION_SCHEME.ts';
export * from './drm/common/OUTPUT_DOWNSCALED.ts';
export * from './drm/common/OUTPUT_RESTRICTED.ts';
export * from './drm/common/PLAYREADY_KEY_SYSTEM.ts';
export * from './drm/common/PLAYREADY_RECOMMENDATION_KEY_SYSTEM.ts';
export * from './drm/common/PLAYREADY_UUID.ts';
export * from './drm/common/RELEASED.ts';
export * from './drm/common/STATUS_PENDING.ts';
export * from './drm/common/SW_SECURE_CRYPTO.ts';
export * from './drm/common/SW_SECURE_DECODE.ts';
export * from './drm/common/USABLE.ts';
export * from './drm/common/W3C_CLEAR_KEY_UUID.ts';
export * from './drm/common/WEBM.ts';
export * from './drm/common/WIDEVINE_KEY_SYSTEM.ts';
export * from './drm/common/WIDEVINE_ROBUSTNESS.ts';
export * from './drm/common/WIDEVINE_UUID.ts';
