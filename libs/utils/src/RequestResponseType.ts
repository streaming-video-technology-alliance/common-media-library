import type { ValueOf } from './ValueOf.ts'

/**
 * The response type of the request.
 *
 * @enum
 *
 * @public
 */
export const RequestResponseType = {
	TEXT: 'text' as const,
	JSON: 'json' as const,
	BLOB: 'blob' as const,
	ARRAY_BUFFER: 'arrayBuffer' as const,
	DOCUMENT: 'document' as const,
	STREAM: 'stream' as const,
} as const

/**
 * @public
 */
export type RequestResponseType = ValueOf<typeof RequestResponseType>;
