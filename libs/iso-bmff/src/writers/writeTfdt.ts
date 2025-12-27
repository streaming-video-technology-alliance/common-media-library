import type { Fields } from '../boxes/types/Fields.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/types/TrackFragmentBaseMediaDecodeTimeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackFragmentBaseMediaDecodeTimeBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Base Media Decode Time Box
 *
 * @param box - The TrackFragmentBaseMediaDecodeTimeBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeTfdt(box: Fields<TrackFragmentBaseMediaDecodeTimeBox>): IsoBoxWriteView {
	const size = box.version === 1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const baseMediaDecodeTimeSize = size
	const totalSize = headerSize + fullBoxSize + baseMediaDecodeTimeSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('tfdt', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.baseMediaDecodeTime, size)

	return writer
}
