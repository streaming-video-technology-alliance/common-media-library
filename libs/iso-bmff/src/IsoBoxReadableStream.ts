import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import { createWriterConfig } from './utils/createWriterConfig.ts'
import { writeIsoBox } from './writeIsoBox.ts'

// Extending the bare ReadableStream global would read it at module scope, which
// breaks tree-shaking (bundlers treat unknown global reads as side effects) and
// throws at import time on runtimes without the Web Streams API. Resolve the base
// class through a guarded local binding instead: `typeof` on an undeclared
// identifier never throws, and the pure IIFE lets bundlers drop the whole
// statement when IsoBoxReadableStream is unused.
const ReadableStreamBase: typeof ReadableStream = /* @__PURE__ */ (() =>
	typeof ReadableStream === 'undefined'
		? // eslint-disable-next-line @typescript-eslint/no-extraneous-class
			(class {
				constructor() {
					throw new Error('ReadableStream is not available in this environment')
				}
			} as unknown as typeof ReadableStream)
		: ReadableStream)()

/**
 * A readable stream of ISO BMFF boxes as Uint8Arrays.
 *
 * The class needs `ReadableStream`. For an example, see {@link createIsoBoxReadableStream}.
 *
 * @public
 */
export class IsoBoxReadableStream extends ReadableStreamBase<Uint8Array> {
	/**
	 * Constructs a new IsoBoxReadableStream.
	 *
	 * @param boxes - The boxes to stream.
	 * @param config - The configuration for the stream.
	 *
	 * @throws Error if `ReadableStream` is not available in this environment.
	 * @throws Error if a box has no writer, no `boxes` field of a container, and no `view`. The message starts with "No writer found for box type".
	 * @throws RangeError if a `bigint` field does not fit its size.
	 */
	constructor(boxes: Iterable<IsoBoxStreamable<IsoInt64>>, config: IsoBoxWriteViewConfig) {
		const iterator = boxes[Symbol.iterator]()
		const cfg = createWriterConfig(config)

		function pull(controller: ReadableStreamDefaultController<Uint8Array>) {
			const next = iterator.next()

			if (next.done) {
				controller.close()
			} else {
				controller.enqueue(writeIsoBox(next.value, cfg))
			}
		}

		function cancel() {
			iterator.return?.()
		}

		super({ start: pull, pull, cancel })
	}
}
