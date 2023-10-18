import { SfMember } from './SfMember.js';
import { serializeList } from './serializeList.js';

export function encodeSfList(value: SfMember[]) {
	return serializeList(value);
}
