import type { MEDIA_KEY_MESSAGE_TYPES } from '../common/MEDIA_KEY_MESSAGE_TYPES';
import type { ValueOf } from '../../utils/ValueOf';

/**
 * Represents a DRM key message for license requests.
 *
 * @group DRM
 * @beta
 */
export type KeyMessage = {
	sessionId?: string;
	message: ArrayBuffer;
	defaultUrl?: string;
	messageType: ValueOf<typeof MEDIA_KEY_MESSAGE_TYPES>;
};
