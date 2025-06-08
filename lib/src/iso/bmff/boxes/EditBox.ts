import type { ContainerBox } from './ContainerBox.js';
import type { EditListBox } from './EditListBox.js';

/**
 * Edit Box - 'edts' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EditBox = ContainerBox<EditListBox> & {
	type: 'edts';
};
