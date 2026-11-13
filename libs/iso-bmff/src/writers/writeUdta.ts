import type { UserDataBox } from '../boxes/UserDataBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write a `UserDataBox` to an `IsoBoxWriteView`.
 *
 * The `writers` map does not need an entry for the `udta` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `UserDataBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeUdta(box: UserDataBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
