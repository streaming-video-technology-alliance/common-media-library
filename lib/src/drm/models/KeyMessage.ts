import { MEDIA_KEY_MESSAGE_TYPES } from '../common/const/MEDIA_KEY_MESSAGE_TYPES';

/**
 * Represents a DRM key message for license requests.
 *
 * @group DRM
 */
export interface KeyMessage {
  sessionId?: string;
  message: ArrayBuffer;
  defaultUrl?: string;
  messageType: (typeof MEDIA_KEY_MESSAGE_TYPES)[keyof typeof MEDIA_KEY_MESSAGE_TYPES];
}
  