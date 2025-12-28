import type { ContainerBox } from './ContainerBox.ts'
import type { EditListBox } from './EditListBox.ts'

/**
 * Edit Box - 'edts' - Container
 *
 * @public
 */
export type EditBox = ContainerBox<EditListBox> & {
	type: 'edts';
};

/**
 * @public
 */
export type edts = EditBox;
