import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'
import { readBytes } from '../cursor/readBytes.ts'

/**
 * Read the `emsg` box (`EventMessageBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * ISO/IEC 23009-1:2022 - 5.10.3.3
 *
 * For a version other than 0 or 1, `messageData` holds all bytes after the full box fields.
 * The strings of the result are empty, the numbers are 0, and the result has no time field.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `EventMessageBox`
 *
 * @example
 * {@includeCode ../../test/readers/readEmsg.test.ts#example}
 *
 * @public
 */
export function readEmsg<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EventMessageBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	if (version === 0) {
		return {
			type: 'emsg',
			version,
			flags,
			schemeIdUri: readTerminatedUtf8(cursor),
			value: readTerminatedUtf8(cursor),
			timescale: readUint32(cursor),
			presentationTimeDelta: readUint32(cursor),
			eventDuration: readUint32(cursor),
			id: readUint32(cursor),
			messageData: readBytes(cursor, cursor.end - cursor.pos),
		}
	}

	if (version === 1) {
		return {
			type: 'emsg',
			version,
			flags,
			timescale: readUint32(cursor),
			presentationTime: readWideUint(cursor, 8),
			eventDuration: readUint32(cursor),
			id: readUint32(cursor),
			schemeIdUri: readTerminatedUtf8(cursor),
			value: readTerminatedUtf8(cursor),
			messageData: readBytes(cursor, cursor.end - cursor.pos),
		}
	}

	return {
		type: 'emsg',
		version,
		flags,
		schemeIdUri: '',
		value: '',
		timescale: 0,
		eventDuration: 0,
		id: 0,
		messageData: readBytes(cursor, cursor.end - cursor.pos),
	}
}
