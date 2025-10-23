import { throwError } from '../utils/throwError.ts'

/**
 * @internal
 */
export function serializeError(src: any, type: string, cause?: any): Error {
	return throwError('serialize', src, type, cause)
}
