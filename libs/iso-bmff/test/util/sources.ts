import {
	CONTAINERS,
	readChildBoxes,
	type IsoBoxReadCursor,
	type IsoBoxReader,
	type IsoInt64,
	type ParsedIsoBox,
} from '@svta/cml-iso-bmff'

/**
 * The source bytes of a box, and the bytes after the last byte that its reader read.
 */
export type Source = { bytes: Uint8Array; remaining: number }

const sources = new WeakMap<object, Source>()

/**
 * Returns a configuration whose readers record the source of each box.
 * A container with no reader gets a reader with the result of `readIsoBoxes`, so its source is recorded too.
 *
 * @param config - The configuration to wrap.
 * @returns The configuration with the wrapped readers.
 */
export function record<C extends { readers?: object }>(config: C): C {
	const recorded: Record<string, IsoBoxReader<{ type: string }, IsoInt64>> = {}
	const containers = CONTAINERS.map(
		type =>
			[
				type,
				(cursor: IsoBoxReadCursor<IsoInt64>, boxType: string) => ({
					type: boxType,
					boxes: readChildBoxes(cursor),
				}),
			] as const,
	)

	const readers = Object.entries(config.readers ?? {}) as [
		string,
		IsoBoxReader<{ type: string }, IsoInt64>,
	][]

	for (const [type, reader] of [...containers, ...readers]) {
		recorded[type] = (cursor, boxType) => {
			const box = reader(cursor, boxType)
			const { view, start, end, pos } = cursor

			sources.set(box, {
				bytes: new Uint8Array(view.buffer, view.byteOffset + start, end - start),
				remaining: end - pos,
			})

			return box
		}
	}

	return { ...config, readers: recorded }
}

/**
 * Returns the source of a box that a read with a `record` configuration returned, or of a raw box.
 *
 * @param box - The box.
 * @returns The source bytes and the bytes that the reader did not read.
 */
export function sourceOf(box: ParsedIsoBox<IsoInt64> | object): Source {
	const recorded = sources.get(box)

	if (recorded) {
		return recorded
	}

	if ('bytes' in box && box.bytes instanceof Uint8Array) {
		return { bytes: box.bytes, remaining: 0 }
	}

	throw new Error('The box has no recorded source')
}
