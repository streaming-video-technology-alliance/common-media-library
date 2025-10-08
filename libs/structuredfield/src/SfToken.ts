/**
 * A class to represent structured field tokens when `Symbol` is not available.
 *
 *
 * @beta
 */
export class SfToken {
	description: string;

	constructor(description: string) {
		this.description = description;
	}
}
