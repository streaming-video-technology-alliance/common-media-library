import { throwError } from '../utils/throwError.js';

export function serializeError(src: any, type: string, cause?: any) {
	return throwError('serialize', src, type, cause);
}
