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
	isGroupLabel: boolean
	labelId: number
	language: string
	label: string
}
