import { SfItem } from '../SfItem.ts'
import type { SfMember } from '../SfMember.ts'
import { serializeBareItem } from './serializeBareItem.ts'
import { serializeInnerList } from './serializeInnerList.ts'
import { serializeParams } from './serializeParams.ts'

/**
 * Serialize a list member: an inner list when the value is an array, an item otherwise.
 *
 * @internal
 */
export function serializeMember(member: SfMember): string {
	if (member instanceof SfItem) {
		const { value, params } = member

		if (Array.isArray(value)) {
			return serializeInnerList(value, params)
		}

		return `${serializeBareItem(value)}${serializeParams(params)}`
	}

	if (Array.isArray(member)) {
		return serializeInnerList(member)
	}

	return serializeBareItem(member)
}
