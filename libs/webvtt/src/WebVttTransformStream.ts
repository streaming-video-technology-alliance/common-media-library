import type { WebVttResult } from './WebVttResult.ts'
import { WebVttTransformer } from './WebVttTransformer.ts'

// Extending the bare TransformStream global would read it at module scope, which
// breaks tree-shaking (bundlers treat unknown global reads as side effects) and
// throws at import time on runtimes without the Web Streams API. Resolve the base
// class through a guarded local binding instead: `typeof` on an undeclared
// identifier never throws, and the pure IIFE lets bundlers drop the whole
// statement when WebVttTransformStream is unused.
const TransformStreamBase: typeof TransformStream = /* @__PURE__ */ (() =>
	typeof TransformStream === 'undefined'
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		? class {
			constructor() {
				throw new Error('TransformStream is not available in this environment')
			}
		} as unknown as typeof TransformStream
		: TransformStream
)()

/**
 * WebVTT transform stream.
 *
 * @public
 */
export class WebVttTransformStream extends TransformStreamBase<string, WebVttResult> {
	constructor(writableStrategy?: QueuingStrategy<string>, readableStrategy?: QueuingStrategy<WebVttResult>) {
		super(new WebVttTransformer(), writableStrategy, readableStrategy)
	}
}
