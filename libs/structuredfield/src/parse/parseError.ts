import { throwError } from '../utils/throwError.js';

export function parseError(src: any, type: string, cause?: any): Error {
	return throwError('parse', src, type, cause);
}
