import type { BoxType } from './BoxType.ts'

/**
 * Base Box Type
 *
 *
 * @beta
 */
export type Box<T extends BoxType> = {
	type: T
	size: number
	largesize?: number
	usertype?: number[]
}
