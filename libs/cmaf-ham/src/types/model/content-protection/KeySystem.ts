import type { FAIRPLAY_KEY_SYSTEM, PLAYREADY_KEY_SYSTEM, WIDEVINE_KEY_SYSTEM } from '@svta/cml-drm'

/**
 * CMAF-HAM Key System type
 *
 * @alpha
 */
export type KeySystem = typeof FAIRPLAY_KEY_SYSTEM | typeof PLAYREADY_KEY_SYSTEM | typeof WIDEVINE_KEY_SYSTEM;
