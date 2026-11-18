import type { FullBox } from './FullBox.ts'

/**
 * Handler Reference Box (`hdlr`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.3
 *
 * @public
 */
export type HandlerBox = FullBox & {
	type: 'hdlr'
	/** The `pre_defined` field. `writeHdlr` writes 0 for a missing value. */
	preDefined?: number
	handlerType: string
	/**
	 * The `reserved` field. QuickTime files can store data here, such as a manufacturer code.
	 * `writeHdlr` writes 0 for a missing value.
	 */
	reserved?: number[]
	name: string
}
