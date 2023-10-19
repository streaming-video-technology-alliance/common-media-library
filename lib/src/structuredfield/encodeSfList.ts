import { SfEncodeOptions } from './SfEncodeOptions.js';
import { SfMember } from './SfMember.js';
import { serializeList } from './serializeList.js';

export function encodeSfList(value: SfMember[], options?: SfEncodeOptions) {
	return serializeList(value, options);
}
