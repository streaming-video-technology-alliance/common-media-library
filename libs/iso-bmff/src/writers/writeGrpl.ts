import type { GroupsListBox } from '../boxes/GroupsListBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `grpl` box (`GroupsListBox`).
 *
 * The `writers` map does not need an entry for the `grpl` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param box - The `GroupsListBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeGrpl(
	box: GroupsListBox<IsoInt64>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
