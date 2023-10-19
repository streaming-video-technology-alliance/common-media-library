import { SfEncodeOptions } from './SfEncodeOptions.js';
import { serializeDict } from './serializeDict.js';

export function encodeSfDict(value: Record<string, any> | Map<string, any>, options?: SfEncodeOptions) {
	return serializeDict(value, options);
}
