import type { ContainerBox } from './ContainerBox.js';
import type { DataReferenceBox } from './DataReferenceBox.js';

/**
 * Data Information Box - 'dinf' - Container
 */
export type DataInformationBox = ContainerBox<DataReferenceBox> & {
	type: 'dinf';
};
