import type { WebVttResult } from './WebVttResult.ts';
import { WebVttTransformer } from './WebVttTransformer.ts';

/**
 * WebVTT transform stream.
 *
 *
 * @beta
 */
export class WebVttTransformStream extends TransformStream<string, WebVttResult> {
	constructor(writableStrategy?: QueuingStrategy<string>, readableStrategy?: QueuingStrategy<WebVttResult>) {
		super(new WebVttTransformer(), writableStrategy, readableStrategy);
	}
}
