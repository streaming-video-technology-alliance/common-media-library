import type { ContainerBox } from './ContainerBox.ts'
import type { DataReferenceBox } from './DataReferenceBox.ts'

/**
 * Data Information Box - 'dinf' - Container
 *
 * @public
 */
export type DataInformationBox = ContainerBox<DataReferenceBox> & {
	type: 'dinf';
};
