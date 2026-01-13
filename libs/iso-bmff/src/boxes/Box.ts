import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Base Box Type
 *
 * @public
 */
export type Box<T extends IsoBoxType = never> = {
	type: T;
};
