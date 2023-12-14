import { SfBareItem } from './SfBareItem.js';
import { SfParameters } from './SfParameters.js';

/**
 * Structured Field Item
 *
 * @group Structured Field
 *
 * @beta
 */
export class SfItem {

	value: SfBareItem;

	params?: SfParameters;

	constructor(value: any, params?: SfParameters) {
		if (Array.isArray(value)) {
			value = value.map((v) => (v instanceof SfItem) ? v : new SfItem(v));
		}

		this.value = value;
		this.params = params;
	}
}
