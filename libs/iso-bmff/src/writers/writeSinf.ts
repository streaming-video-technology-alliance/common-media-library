import type { ProtectionSchemeInformationBox } from '../boxes/ProtectionSchemeInformationBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write a `ProtectionSchemeInformationBox` to an `IsoBoxWriteView`.
 *
 * The `writers` map does not need an entry for the `sinf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `ProtectionSchemeInformationBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeSinf(
	box: ProtectionSchemeInformationBox,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
