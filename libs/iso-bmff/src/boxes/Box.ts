import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * The base of every box: the four-character `type`.
 *
 * @public
 */
export type Box<T extends IsoBoxType = never> = {
	type: T
}
