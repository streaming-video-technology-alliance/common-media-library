/**
 * A class to represent structured field tokens when `Symbol` is not available.
 *
 * @group Structured Field
 *
 * @beta
 */
export class SfToken {
	description: string;

	constructor(description: string) {
		this.description = description;
	}
}
