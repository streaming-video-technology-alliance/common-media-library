import type { DataReferenceBox } from './DataReferenceBox.ts'

/**
 * Child boxes of Data Information Box
 *
 * @public
 */
export type DataInformationBoxChild = DataReferenceBox

/**
 * Data Information Box (`dinf`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.1
 *
 * @public
 */
export type DataInformationBox = {
	type: 'dinf'
	boxes: DataInformationBoxChild[]
}
