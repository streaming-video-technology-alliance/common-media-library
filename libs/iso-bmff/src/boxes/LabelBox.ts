import type { FullBox } from './FullBox.ts'

/**
 * Label Box (`labl`).
 *
 * ISO/IEC 14496-12
 *
 * @public
 */
export type LabelBox = FullBox & {
	type: 'labl'
	/**
	 * The flags of the box. The bit `0x1` is set for a group label. Test it with `(box.flags & 0x1) !== 0`.
	 */
	flags: number
	labelId: number
	language: string
	label: string
}
