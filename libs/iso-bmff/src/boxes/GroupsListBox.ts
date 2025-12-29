import type { ContainerBox } from './ContainerBox.ts'

/**
 * Groups List Box - 'grpl' - Container
 *
 * @public
 */
export type GroupsListBox = ContainerBox<any> & {
	type: 'grpl'
}

/**
 * @public
 */
export type grpl = GroupsListBox;
