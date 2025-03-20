/**
 * Represents a DRM Key System.
 *
 * @group DRM
 * @beta
 */
export type KeySystem = {
  /**
   * The UUID identifying the key system
   */
  uuid: string;

  /**
   * Optional scheme ID URI for the key system
   */
  schemeIdURI?: string;
};
  
