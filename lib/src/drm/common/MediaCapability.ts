/**
 * Represents the media capability of a DRM system.
 *
 * Used in MediaKeySystemConfiguration to describe the type of media that a DRM system can handle.
 *
 * @group DRM
 * @public
 * @beta
 */
export type MediaCapability = {
    contentType: string;
    robustness: string;
    encryptionScheme?: 'cenc' | 'cbcs';
}
