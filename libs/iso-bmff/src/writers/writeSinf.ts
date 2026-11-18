import type { ProtectionSchemeInfoBox } from '../boxes/ProtectionSchemeInfoBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `sinf` box (`ProtectionSchemeInfoBox`).
 *
 * The `writers` map does not need an entry for the `sinf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `ProtectionSchemeInfoBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeSinf(
	box: ProtectionSchemeInfoBox,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
