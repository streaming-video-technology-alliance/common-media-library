import type { FullBox } from './FullBox.ts'

/**
 * Handler Reference Box (`hdlr`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.3
 *
 * @public
 */
export type HandlerReferenceBox = FullBox & {
	type: 'hdlr'
	preDefined: number
	handlerType: string
	reserved: number[]
	name: string
}
