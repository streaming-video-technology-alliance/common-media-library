/**
 * Represents a ContentProtection element in DASH manifest.
 *
 * @group DRM
 * @beta
 */
export type ContentProtection = {
  schemeIdUri?: string;
  value?: string;
  pssh?: {
    __text: string;
  };
  laUrl?: {
    __text: string;
  };
}; 
