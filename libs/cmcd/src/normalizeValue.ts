import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { formatNor } from './formatNor.ts'
import { toTokenString } from './toTokenString.ts'

type CmcdStringKeySpec = Extract<CmcdKeySpec, { type: 'string' | 'custom' }>

function toText(value: unknown, spec: CmcdStringKeySpec, version: CmcdVersion): string | undefined {
	const max = (version === 1 ? spec.v1Max : undefined) ?? spec.max ?? Infinity

	return typeof value === 'string' && value !== '' && value.length <= max ? value : undefined
}

function normalizeBare(value: unknown, spec: CmcdKeySpec, version: CmcdVersion): unknown {
	switch (spec.type) {
		case 'boolean':
			return typeof value === 'boolean' ? value : undefined

		case 'integer':
		case 'ot-list':
			return typeof value === 'number' && Number.isFinite(value) ? Math.round(value / spec.round) * spec.round : undefined

		case 'decimal':
			return typeof value === 'number' && Number.isFinite(value) ? value : undefined

		case 'string':
			return toText(value, spec, version)

		case 'string-list':
			return typeof value === 'string' && value !== '' ? value : undefined

		case 'token': {
			const text = toTokenString(value)
			const v1Map = version === 1 ? spec.v1Map : undefined
			const token = text !== undefined && v1Map !== undefined && Object.prototype.hasOwnProperty.call(v1Map, text) ? v1Map[text] : text

			return token ? new SfToken(token) : undefined
		}

		case 'custom':
			if (typeof value === 'string') {
				return toText(value, spec, version)
			}

			if (typeof value === 'number') {
				return Number.isFinite(value) ? value : undefined
			}

			if (Array.isArray(value)) {
				return value.length > 0 ? value : undefined
			}

			return typeof value === 'boolean' || typeof value === 'symbol' || value instanceof SfToken ? value : undefined

		default:
			return undefined
	}
}

function normalizeItem(value: unknown, spec: CmcdKeySpec, version: CmcdVersion): unknown {
	if (value instanceof SfItem) {
		const bare = normalizeBare(value.value, spec, version)

		return bare === undefined ? undefined : new SfItem(bare, value.params)
	}

	return normalizeBare(value, spec, version)
}

function normalizeList(value: unknown, spec: CmcdKeySpec, version: CmcdVersion): unknown {
	const wrapper = value instanceof SfItem && Array.isArray(value.value) ? value : undefined
	const items = wrapper ? wrapper.value as unknown as unknown[] : Array.isArray(value) ? value : [value]
	const list: unknown[] = []

	for (const item of items) {
		const normalized = normalizeItem(item, spec, version)

		if (normalized !== undefined) {
			list.push(normalized)
		}
	}

	if (list.length === 0) {
		return undefined
	}

	return wrapper ? new SfItem(list, wrapper.params) : list
}

/**
 * Applies the value rule of a key type from the key table.
 *
 * An `SfItem` keeps its parameters, and the rule applies to the value inside it.
 * In version 2, a list key wraps one value in a list.
 * The rules do not check the limits of RFC 8941, such as the integer range.
 *
 * @param value - The value to prepare.
 * @param spec - The row of the key in the key table.
 * @param options - The version and `baseUrl` of the report.
 *
 * @returns The value to send, or `undefined` when the value fails the rule.
 *
 * @internal
 */
export function normalizeValue(value: unknown, spec: CmcdKeySpec, options: CmcdFormatterOptions): unknown {
	if (spec.type === 'nor') {
		return formatNor(value, options)
	}

	if (spec.type === 'string-list' || (spec.type === 'ot-list' && options.version !== 1)) {
		return normalizeList(value, spec, options.version)
	}

	return normalizeItem(value, spec, options.version)
}
