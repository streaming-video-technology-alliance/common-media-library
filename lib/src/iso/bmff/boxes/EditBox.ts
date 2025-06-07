import type { ContainerBox } from './ContainerBox.js';
import type { EditListBox } from './EditListBox.js';

/**
 * Edit Box - 'edts' - Container
 */
export type EditBox = ContainerBox<EditListBox> & {
	type: 'edts';
};
