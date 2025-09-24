import type { ContainerBox } from './ContainerBox.js';
import type { DataReferenceBox } from './DataReferenceBox.js';

/**
 * Data Information Box - 'dinf' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DataInformationBox = ContainerBox<DataReferenceBox> & {
	type: 'dinf';
};
