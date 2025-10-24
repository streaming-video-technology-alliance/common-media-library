import type { ValueOf } from './ValueOf.ts'

/**
 * The content type of the request.
 *
 *
 * @enum
 *
 * @beta
 */
export const RequestType = {
	TEXT: 'text' as const,
	JSON: 'json' as const,
	BLOB: 'blob' as const,
	ARRAY_BUFFER: 'arrayBuffer' as const,
	DOCUMENT: 'document' as const,
} as const

/**
 * @beta
 */
export type RequestType = ValueOf<typeof RequestType>;
