import { SfItem } from '../SfItem.ts'
import type { SfMember } from '../SfMember.ts'
import { serializeBareItem } from './serializeBareItem.ts'
import { serializeInnerList } from './serializeInnerList.ts'
import { serializeKey } from './serializeKey.ts'
import { serializeParams } from './serializeParams.ts'

/**
 * Serialize one dictionary member: the key, then the parameters alone for a `true` value, otherwise `=` and the member.
 *
 * @internal
 */
export function serializeDictMember(key: string, member: SfMember): string {
	const output = serializeKey(key)

	if (member instanceof SfItem) {
		const { value, params } = member

		if (value === true) {
			return `${output}${serializeParams(params)}`
		}

		if (Array.isArray(value)) {
			return `${output}=${serializeInnerList(value, params)}`
		}

		return `${output}=${serializeBareItem(value)}${serializeParams(params)}`
	}

	if (member === true) {
		return output
	}

	if (Array.isArray(member)) {
		return `${output}=${serializeInnerList(member)}`
	}

	return `${output}=${serializeBareItem(member)}`
}
