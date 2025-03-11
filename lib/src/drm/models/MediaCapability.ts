/**
 * Represents the media capability of a DRM system.
 *
 * Used in MediaKeySystemConfiguration to describe the type of media that a DRM system can handle.
 *
 * @group DRM
 * @public
 */
export interface MediaCapability {
    contentType: string;
    robustness: string;
}
