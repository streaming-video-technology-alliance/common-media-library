import type { SfBareItem } from './SfBareItem.ts'

/**
 * Structured Field Item
 *
 * @public
 */
export class SfItem<
	V extends SfBareItem = SfBareItem,
	P = Record<string, any>
> {

	/**
	 * The value of the item.
	 */
	value: V

	/**
	 * The parameters of the item.
	 */
	params?: P

	/**
	 * Creates a new structured field item.
	 *
	 * @param value - The value of the item.
	 * @param params - The parameters of the item.
	 */
	constructor(value: any, params?: P) {
		if (Array.isArray(value)) {
			value = value.map((v) => (v instanceof SfItem) ? v : new SfItem(v))
		}

		this.value = value
		this.params = params
	}
}
