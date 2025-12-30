import type { EditListBox } from './EditListBox.ts'

/**
 * Child boxes of Edit Box
 *
 * @public
 */
export type EditBoxChild = EditListBox;

/**
 * Edit Box - 'edts' - Container
 *
 * @public
 */
export type EditBox = {
	type: 'edts';
	boxes: EditBoxChild[];
};
