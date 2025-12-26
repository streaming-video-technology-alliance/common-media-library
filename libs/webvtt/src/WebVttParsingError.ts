/**
 * A WebVTT parsing error.
 *
 * @public
 */
export class WebVttParsingError extends Error {

	/**
	 * Create a new WebVTT parsing error.
	 *
	 * @param message - The message of the error.
	 */
	constructor(message: string) {
		super(message)
		this.name = 'WebVttParsingError'
	}
}
