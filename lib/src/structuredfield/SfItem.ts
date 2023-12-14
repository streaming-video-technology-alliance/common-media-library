import { SfBareItem } from './SfBareItem.js';
import { SfParameters } from './SfParameters.js';

/**
 * Structured Field Item
 *
 * @group Structured Field
 *
 * @beta
 */
export class SfItem<V = SfBareItem, P = SfParameters> {

	value: V;

	params?: P;

	constructor(value: any, params?: P) {
		if (Array.isArray(value)) {
			value = value.map((v) => (v instanceof SfItem) ? v : new SfItem<V, P>(v));
		}

		this.value = value;
		this.params = params;
	}
}
