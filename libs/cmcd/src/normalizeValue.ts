import { SfItem, SfToken, symbolToStr } from '@svta/cml-structured-field-values'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import type { PrepareContext } from './PrepareContext.ts'

type OtItem = number | SfItem<number, Record<string, boolean>>

function roundTo(value: number, step: number): number {
	return Math.round(value / step) * step
}

/** The text of a token given as a string, a symbol, an `SfToken`, or an `SfItem` of one of those. */
export function toTokenText(value: unknown): string | undefined {
	if (value instanceof SfItem) {
		return toTokenText(value.value)
	}
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'symbol' || value instanceof SfToken) {
		return symbolToStr(value)
	}
	return undefined
}

function toOtItems(value: unknown, step: number): OtItem[] {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? [roundTo(value, step)] : []
	}
	if (value instanceof SfItem) {
		return typeof value.value === 'number' && Number.isFinite(value.value) ? [new SfItem(roundTo(value.value, step), value.params)] : []
	}
	if (Array.isArray(value)) {
		return value.flatMap(item => toOtItems(item, step))
	}
	if (value && typeof value === 'object') {
		const items: OtItem[] = []
		for (const [ot, amount] of Object.entries(value)) {
			if (typeof amount === 'number' && Number.isFinite(amount)) {
				items.push(new SfItem(roundTo(amount, step), { [ot]: true }))
			}
		}
		return items
	}
	return []
}

function collapse(items: OtItem[], reportOt: string | undefined): number {
	const match = reportOt === undefined ? undefined : items.find(item => item instanceof SfItem && item.params?.[reportOt] === true)
	const first = match ?? items[0]
	return first instanceof SfItem ? first.value : first
}

/**
 * Turns one plain value into its structured-field form, or `undefined` when the value is empty or invalid for the key.
 * `reportOt` is the report's object type, used to collapse a list in version 1.
 */
export function normalizeValue(value: unknown, spec: CmcdKeySpec, context: PrepareContext, reportOt: string | undefined): unknown {
	switch (spec.type) {
		case 'boolean':
			return typeof value === 'boolean' ? value : undefined
		case 'integer':
			return typeof value === 'number' && Number.isFinite(value) ? roundTo(value, spec.round ?? 1) : undefined
		case 'decimal':
			return typeof value === 'number' && Number.isFinite(value) ? value : undefined
		case 'string':
			return typeof value === 'string' && value !== '' && (spec.max === undefined || value.length <= spec.max) ? value : undefined
		case 'token': {
			const text = toTokenText(value)
			return text !== undefined && text !== '' && (spec.tokens === undefined || spec.tokens.includes(text)) ? new SfToken(text) : undefined
		}
		case 'string-list': {
			const list = (Array.isArray(value) ? value : [value]).filter(item => typeof item === 'string' && item !== '')
			return list.length > 0 ? list : undefined
		}
		case 'ot-list': {
			const items = toOtItems(value, spec.round ?? 1)
			if (items.length === 0) {
				return undefined
			}
			return context.version === 1 && spec.v1 === 'scalar' ? collapse(items, reportOt) : items
		}
		case 'custom': {
			if (typeof value === 'string') {
				return value !== '' && value.length <= (spec.max ?? Infinity) ? value : undefined
			}
			if (typeof value === 'number') {
				return Number.isFinite(value) ? value : undefined
			}
			if (Array.isArray(value)) {
				return value.length > 0 ? [...value] : undefined
			}
			return typeof value === 'boolean' || typeof value === 'symbol' || value instanceof SfToken || value instanceof SfItem ? value : undefined
		}
		default:
			return undefined
	}
}
