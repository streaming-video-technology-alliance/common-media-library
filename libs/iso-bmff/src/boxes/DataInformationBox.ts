import type { DataReferenceBox } from './DataReferenceBox.ts'

/**
 * Child boxes of Data Information Box
 *
 * @public
 */
export type DataInformationBoxChild = DataReferenceBox;

/**
 * Data Information Box - 'dinf' - Container
 *
 * @public
 */
export type DataInformationBox = {
	type: 'dinf';
	boxes: DataInformationBoxChild[];
};

/**
 * @public
 */
export type dinf = DataInformationBox;
