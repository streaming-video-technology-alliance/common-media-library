import type { ValueOf } from '@svta/cml-utils';
import { INDIVIDUALIZATION_REQUEST } from './INDIVIDUALIZATION_REQUEST.ts';
import { LICENSE_RELEASE } from './LICENSE_RELEASE.ts';
import { LICENSE_RENEWAL } from './LICENSE_RENEWAL.ts';
import { LICENSE_REQUEST } from './LICENSE_REQUEST.ts';

/**
 * Media Key Message Types.
 *
 *
 * @beta
 */
export const MediaKeyMessageType = {
	LICENSE_REQUEST: LICENSE_REQUEST as typeof LICENSE_REQUEST,
	LICENSE_RENEWAL: LICENSE_RENEWAL as typeof LICENSE_RENEWAL,
	LICENSE_RELEASE: LICENSE_RELEASE as typeof LICENSE_RELEASE,
	INDIVIDUALIZATION_REQUEST: INDIVIDUALIZATION_REQUEST as typeof INDIVIDUALIZATION_REQUEST,
} as const;

/**
 * Media Key Message Types.
 *
 *
 * @beta
 */
export type MediaKeyMessageType = ValueOf<typeof MediaKeyMessageType>;
