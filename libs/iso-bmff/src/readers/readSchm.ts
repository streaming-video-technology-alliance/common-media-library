import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `schm` box (`SchemeTypeBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SchemeTypeBox`
 *
 * @example
 * {@includeCode ../../test/readers/readSchm.test.ts#example}
 *
 * @public
 */
export function readSchm(cursor: IsoBoxReadCursor<IsoInt64>): SchemeTypeBox {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	return {
		type: 'schm',
		version,
		flags,
		schemeType: view.readUint(4),
		schemeVersion: view.readUint(4),
		schemeUri: flags & 0x000001 ? view.readUtf8(-1) : undefined,
	}
}
