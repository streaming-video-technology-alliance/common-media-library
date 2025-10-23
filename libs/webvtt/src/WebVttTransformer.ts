import { WebVttParser } from './WebVttParser.ts'
import type { WebVttResult } from './WebVttResult.ts'
import { WebVttResultType } from './WebVttResultType.ts'

/**
 * WebVTT transform stream transformer.
 *
 *
 * @beta
 */
export class WebVttTransformer {
	private readonly parser: WebVttParser
	private results: WebVttResult[] = []

	/**
	 * Creates a new WebVTT transformer.
	 */
	constructor() {
		this.parser = new WebVttParser()
		this.parser.oncue = cue => this.results.push({ type: WebVttResultType.CUE, data: cue })
		this.parser.onregion = region => this.results.push({ type: WebVttResultType.REGION, data: region })
		this.parser.onstyle = style => this.results.push({ type: WebVttResultType.STYLE, data: style })
		this.parser.ontimestampmap = timestampmap => this.results.push({ type: WebVttResultType.TIMESTAMP_MAP, data: timestampmap })
		this.parser.onparsingerror = error => this.results.push({ type: WebVttResultType.ERROR, data: error })
	}

	private enqueueResults(controller: TransformStreamDefaultController<WebVttResult>): void {
		// TODO: Should parse errors throw?
		for (const result of this.results) {
			controller.enqueue(result)
		}

		this.results = []
	}

	/**
	 * Transforms a chunk of WebVTT data.
	 *
	 * @param chunk - The chunk of WebVTT data to transform.
	 * @param controller - The controller to enqueue the results to.
	 */
	transform(chunk: string, controller: TransformStreamDefaultController<WebVttResult>): void {
		try {
			this.parser.parse(chunk)
			this.enqueueResults(controller)
		}
		catch (error) {
			controller.error(error)
		}
	}

	/**
	 * Flushes the transformer.
	 *
	 * @param controller - The controller to enqueue the results to.
	 */
	flush(controller: TransformStreamDefaultController<WebVttResult>): void {
		try {
			this.parser.flush()
			this.enqueueResults(controller)
		}
		catch (error) {
			controller.error(error)
		}
	}
}
