import type { WebVttResult } from './WebVttResult.js';
import { WebVttTransformer } from './WebVttTransformer.js';

/**
 * WebVTT transform stream.
 *
 * @group WebVTT
 *
 * @beta
 */
export class WebVttTransformStream extends TransformStream<string, WebVttResult> {
	constructor(writableStrategy?: QueuingStrategy<string>, readableStrategy?: QueuingStrategy<WebVttResult>) {
		super(new WebVttTransformer(), writableStrategy, readableStrategy);
	}
}
