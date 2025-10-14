import type { ContainerBox } from './ContainerBox.ts';
import type { EditListBox } from './EditListBox.ts';

/**
 * Edit Box - 'edts' - Container
 *
 *
 * @beta
 */
export type EditBox = ContainerBox<EditListBox> & {
	type: 'edts';
};
