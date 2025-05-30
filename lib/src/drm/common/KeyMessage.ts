import type { ValueOf } from '../../utils/ValueOf.js';
import type { MediaKeyMessageType } from './MediaKeyMessageType.js';

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
	messageType: ValueOf<typeof MediaKeyMessageType>;
};
