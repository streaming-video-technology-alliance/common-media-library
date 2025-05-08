import type { ValueOf } from '../../utils/ValueOf.ts';
import type { MediaKeyMessageType } from './MediaKeyMessageType.ts';

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
