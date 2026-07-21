import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
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
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		? class {
			constructor() {
				throw new Error('ReadableStream is not available in this environment')
			}
		} as unknown as typeof ReadableStream
		: ReadableStream
)()

/**
 * A readable stream of ISO BMFF boxes as Uint8Arrays.
 *
 * @public
 */
export class IsoBoxReadableStream extends ReadableStreamBase<Uint8Array> {
	/**
	 * Constructs a new IsoBoxReadableStream.
	 *
	 * @param boxes - The boxes to stream.
	 * @param config - The configuration for the stream.
	 */
	constructor(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig) {
		const iterator = boxes[Symbol.iterator]()
		const cfg = createWriterConfig(config)

		function pull(controller: ReadableStreamDefaultController<Uint8Array>) {
			const desiredSize = controller.desiredSize ?? 0

			for (let i = 0; i < desiredSize; i++) {
				const { value, done } = iterator.next()

				if (done) {
					controller.close()
				} else {
					controller.enqueue(writeIsoBox(value, cfg))
				}
			}
		}

		super({ start: pull, pull })
	}
}
